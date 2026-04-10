import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatRoom, ChatRoomDocument, ChatRoomType } from './schemas/chat-room.schema';
import { CreateChatRoomDto, UpdateChatRoomDto, ManageMembersDto } from './dtos/chat-room.dto';

@Injectable()
export class ChatRoomService {
  constructor(
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: Model<ChatRoomDocument>,
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateChatRoomDto, userEmail: string): Promise<ChatRoomDocument> {
    // Always include the authenticated user in the room
    const allMembers = Array.from(new Set([userEmail, ...dto.members]));

    if (dto.type === ChatRoomType.DIRECT) {
      if (allMembers.length !== 2) {
        throw new BadRequestException('Direct rooms must have exactly 2 members');
      }
      // Prevent duplicate direct rooms between the same pair
      const sorted = [...allMembers].sort();
      const existing = await this.chatRoomModel.findOne({
        type: ChatRoomType.DIRECT,
        members: { $all: sorted, $size: 2 },
      });
      if (existing) {
        // Return existing room instead of throwing — idempotent
        return existing;
      }
    }

    if (dto.type === ChatRoomType.PROJECT) {
      if (!dto.projectId) {
        throw new BadRequestException('projectId is required for project rooms');
      }
      const existing = await this.chatRoomModel.findOne({
        type: ChatRoomType.PROJECT,
        projectId: dto.projectId,
      });
      if (existing) {
        throw new ConflictException(
          `A chat room already exists for project ${dto.projectId}`,
        );
      }
    }

    const room = new this.chatRoomModel({
      ...dto,
      members: allMembers,
      createdBy: userEmail,
    });
    return room.save();
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /** List all rooms the user belongs to (not archived). */
  async findAllForUser(userEmail: string): Promise<ChatRoomDocument[]> {
    return this.chatRoomModel
      .find({ members: userEmail, isArchived: false })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async findOne(roomId: string, userEmail: string): Promise<ChatRoomDocument> {
    this.assertValidId(roomId);
    const room = await this.chatRoomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException(`Chat room ${roomId} not found`);
    this.assertMember(room, userEmail);
    return room;
  }

  async findByProjectId(projectId: string, userEmail: string): Promise<ChatRoomDocument> {
    const room = await this.chatRoomModel.findOne({
      type: ChatRoomType.PROJECT,
      projectId,
    }).exec();
    if (!room) throw new NotFoundException(`No chat room for project ${projectId}`);
    this.assertMember(room, userEmail);
    return room;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(
    roomId: string,
    dto: UpdateChatRoomDto,
    userEmail: string,
  ): Promise<ChatRoomDocument> {
    const room = await this.findOne(roomId, userEmail);
    if (room.createdBy !== userEmail) {
      throw new ForbiddenException('Only the room creator can update room details');
    }
    return this.chatRoomModel
      .findByIdAndUpdate(roomId, dto, { returnDocument: 'after' })
      .exec();
  }

  // ─── Member management ─────────────────────────────────────────────────────

  async addMembers(
    roomId: string,
    dto: ManageMembersDto,
    userEmail: string,
  ): Promise<ChatRoomDocument> {
    const room = await this.findOne(roomId, userEmail);
    if (room.type === ChatRoomType.DIRECT) {
      throw new BadRequestException('Cannot add members to a direct room');
    }
    if (room.createdBy !== userEmail) {
      throw new ForbiddenException('Only the room creator can add members');
    }
    return this.chatRoomModel
      .findByIdAndUpdate(
        roomId,
        { $addToSet: { members: { $each: dto.members } } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async removeMembers(
    roomId: string,
    dto: ManageMembersDto,
    userEmail: string,
  ): Promise<ChatRoomDocument> {
    const room = await this.findOne(roomId, userEmail);
    if (room.type === ChatRoomType.DIRECT) {
      throw new BadRequestException('Cannot remove members from a direct room');
    }
    if (room.createdBy !== userEmail) {
      throw new ForbiddenException('Only the room creator can remove members');
    }
    // Creator cannot be removed
    if (dto.members.includes(room.createdBy)) {
      throw new ForbiddenException('Cannot remove the room creator');
    }
    return this.chatRoomModel
      .findByIdAndUpdate(
        roomId,
        { $pull: { members: { $in: dto.members } } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** A member can leave a room themselves. */
  async leaveRoom(roomId: string, userEmail: string): Promise<{ message: string }> {
    const room = await this.findOne(roomId, userEmail);
    if (room.type === ChatRoomType.DIRECT) {
      throw new BadRequestException('Cannot leave a direct room');
    }
    if (room.createdBy === userEmail) {
      throw new ForbiddenException(
        'Room creator cannot leave. Transfer ownership or delete the room.',
      );
    }
    await this.chatRoomModel.findByIdAndUpdate(roomId, {
      $pull: { members: userEmail },
    });
    return { message: 'You have left the room' };
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async remove(roomId: string, userEmail: string): Promise<{ message: string }> {
    const room = await this.findOne(roomId, userEmail);
    if (room.createdBy !== userEmail) {
      throw new ForbiddenException('Only the room creator can delete this room');
    }
    await this.chatRoomModel.findByIdAndDelete(roomId).exec();
    return { message: `Room "${room.name || roomId}" deleted successfully` };
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  /** Update denormalized last-message fields after a new message is sent. */
  async updateLastMessage(
    roomId: string,
    text: string,
    senderEmail: string,
    sentAt: Date,
  ): Promise<void> {
    await this.chatRoomModel.findByIdAndUpdate(roomId, {
      lastMessageText: text?.slice(0, 120) ?? '📎 Attachment',
      lastMessageAt: sentAt,
      lastMessageBy: senderEmail,
    });
  }

  private assertMember(room: ChatRoomDocument, userEmail: string): void {
    if (!room.members.includes(userEmail)) {
      throw new ForbiddenException('You are not a member of this room');
    }
  }

  private assertValidId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid room ID');
    }
  }
}