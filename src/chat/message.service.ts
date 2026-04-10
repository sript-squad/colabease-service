import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument, MessageType } from './schemas/message.schema';
import { ChatRoomService } from './chat-room.service';
import { SendMessageDto, EditMessageDto, ReactToMessageDto } from './dtos/message.dto';

const DEFAULT_PAGE_LIMIT = 30;
const MAX_PAGE_LIMIT = 100;

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly chatRoomService: ChatRoomService,
  ) {}

  // ─── Send ──────────────────────────────────────────────────────────────────

  async send(dto: SendMessageDto, senderEmail: string): Promise<MessageDocument> {
    // Verify sender is a room member
    await this.chatRoomService.findOne(dto.roomId, senderEmail);

    if (!dto.text && (!dto.attachments || dto.attachments.length === 0)) {
      throw new BadRequestException('Message must have text or at least one attachment');
    }

    const messageType = dto.type ?? (dto.attachments?.length ? MessageType.FILE : MessageType.TEXT);

    const message = new this.messageModel({
      roomId: dto.roomId,
      senderEmail,
      type: messageType,
      text: dto.text,
      attachments: dto.attachments ?? [],
      replyToMessageId: dto.replyToMessageId,
      readBy: [senderEmail], // sender has implicitly read their own message
    });

    const saved = await message.save();

    // Update room's last-message preview
    await this.chatRoomService.updateLastMessage(
      dto.roomId,
      dto.text,
      senderEmail,
      saved.createdAt as unknown as Date,
    );

    return saved;
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /**
   * Cursor-based pagination: pass `before` (ISO date string or message ObjectId)
   * to get older messages. Returns messages in descending chronological order
   * so the client can reverse-render them.
   */
  async getMessages(
    roomId: string,
    userEmail: string,
    before?: string,
    limit?: string,
  ): Promise<MessageDocument[]> {
    await this.chatRoomService.findOne(roomId, userEmail);

    const parsedLimit = Math.min(
      parseInt(limit ?? String(DEFAULT_PAGE_LIMIT), 10) || DEFAULT_PAGE_LIMIT,
      MAX_PAGE_LIMIT,
    );

    const filter: any = { roomId, isDeleted: false };

    if (before) {
      // Support both ISO-date cursor and ObjectId cursor
      if (Types.ObjectId.isValid(before)) {
        const pivot = await this.messageModel.findById(before).select('createdAt').lean();
        if (pivot) filter.createdAt = { $lt: pivot.createdAt };
      } else {
        const date = new Date(before);
        if (!isNaN(date.getTime())) filter.createdAt = { $lt: date };
      }
    }

    return this.messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .exec();
  }

  async findOne(messageId: string, userEmail: string): Promise<MessageDocument> {
    this.assertValidId(messageId);
    const msg = await this.messageModel.findById(messageId).exec();
    if (!msg || msg.isDeleted) throw new NotFoundException('Message not found');
    // Verify the user belongs to the room
    await this.chatRoomService.findOne(msg.roomId, userEmail);
    return msg;
  }

  // ─── Edit ──────────────────────────────────────────────────────────────────

  async edit(
    messageId: string,
    dto: EditMessageDto,
    userEmail: string,
  ): Promise<MessageDocument> {
    const msg = await this.findOne(messageId, userEmail);
    if (msg.senderEmail !== userEmail) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    if (msg.type !== MessageType.TEXT) {
      throw new BadRequestException('Only text messages can be edited');
    }
    return this.messageModel.findByIdAndUpdate(
      messageId,
      { text: dto.text, editedAt: new Date() },
      { returnDocument: 'after' },
    ).exec();
  }

  // ─── Soft-delete ───────────────────────────────────────────────────────────

  async remove(messageId: string, userEmail: string): Promise<{ message: string }> {
    const msg = await this.findOne(messageId, userEmail);
    // Allow sender or room creator to delete
    const room = await this.chatRoomService.findOne(msg.roomId, userEmail);
    const canDelete = msg.senderEmail === userEmail || room.createdBy === userEmail;
    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }
    await this.messageModel.findByIdAndUpdate(messageId, {
      isDeleted: true,
      text: null,
      attachments: [],
    });
    return { message: 'Message deleted' };
  }

  // ─── Reactions ─────────────────────────────────────────────────────────────

  async toggleReaction(
    messageId: string,
    dto: ReactToMessageDto,
    userEmail: string,
  ): Promise<MessageDocument> {
    const msg = await this.findOne(messageId, userEmail);

    // Find if this emoji reaction already exists
    const existingReaction = msg.reactions?.find(r => r.emoji === dto.emoji);

    if (!existingReaction) {
      // Add new reaction group with this user
      return this.messageModel.findByIdAndUpdate(
        messageId,
        { $push: { reactions: { emoji: dto.emoji, reactedBy: [userEmail] } } },
        { returnDocument: 'after' },
      ).exec();
    }

    const alreadyReacted = existingReaction.reactedBy.includes(userEmail);

    if (alreadyReacted) {
      // Remove user from the reaction; if empty, remove the whole reaction group
      const willBeEmpty = existingReaction.reactedBy.length === 1;
      if (willBeEmpty) {
        return this.messageModel.findByIdAndUpdate(
          messageId,
          { $pull: { reactions: { emoji: dto.emoji } } },
          { returnDocument: 'after' },
        ).exec();
      } else {
        return this.messageModel.findByIdAndUpdate(
          messageId,
          { $pull: { 'reactions.$[elem].reactedBy': userEmail } },
          {
            arrayFilters: [{ 'elem.emoji': dto.emoji }],
            returnDocument: 'after',
          },
        ).exec();
      }
    } else {
      // Add user to existing reaction group
      return this.messageModel.findByIdAndUpdate(
        messageId,
        { $addToSet: { 'reactions.$[elem].reactedBy': userEmail } },
        {
          arrayFilters: [{ 'elem.emoji': dto.emoji }],
          returnDocument: 'after',
        },
      ).exec();
    }
  }

  // ─── Read receipts ─────────────────────────────────────────────────────────

  /**
   * Mark all messages in a room as read by the given user.
   * Called when the user opens or focuses a chat room.
   */
  async markRoomAsRead(roomId: string, userEmail: string): Promise<{ updated: number }> {
    await this.chatRoomService.findOne(roomId, userEmail);
    const result = await this.messageModel.updateMany(
      { roomId, readBy: { $ne: userEmail }, isDeleted: false },
      { $addToSet: { readBy: userEmail } },
    );
    return { updated: result.modifiedCount };
  }

  /**
   * Count unread messages per room for the user — useful for badge counts.
   */
  async getUnreadCounts(
    roomIds: string[],
    userEmail: string,
  ): Promise<Record<string, number>> {
    const counts = await this.messageModel.aggregate([
      {
        $match: {
          roomId: { $in: roomIds },
          readBy: { $ne: userEmail },
          isDeleted: false,
        },
      },
      { $group: { _id: '$roomId', count: { $sum: 1 } } },
    ]);

    return counts.reduce(
      (acc, { _id, count }) => ({ ...acc, [_id]: count }),
      {} as Record<string, number>,
    );
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private assertValidId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid message ID');
    }
  }
}