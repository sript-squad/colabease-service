import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { TokenHandleService } from 'src/auth/token-handle.service';
import { ChatRoomService } from './chat-room.service';
import { SendMessageDto, EditMessageDto, ReactToMessageDto } from './dtos/message.dto';
import { MessageService } from './message.service';


/**
 * Socket.IO gateway for real-time chat.
 *
 * Connection flow:
 *   1. Client connects with Authorization header or auth.token handshake param.
 *   2. Gateway verifies the Cognito JWT via TokenHandleService.
 *   3. On success, the socket is associated with the user's email.
 *   4. Client emits `join_room` with { roomId } to subscribe to room events.
 *
 * Emitted server events:
 *   - `new_message`       — broadcast to room when a message is sent
 *   - `message_edited`    — broadcast to room when a message is edited
 *   - `message_deleted`   — broadcast to room when a message is deleted
 *   - `reaction_updated`  — broadcast to room when a reaction changes
 *   - `user_typing`       — broadcast to room (excluding sender) when someone types
 *   - `user_stop_typing`  — broadcast to room (excluding sender) when typing stops
 *   - `room_read`         — broadcast to room when a user reads all messages
 *   - `error`             — sent to the originating client on failure
 */
@WebSocketGateway({
  cors: { origin: '*' }, // tighten in production
  namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /** Maps socket.id → userEmail */
  private socketUserMap = new Map<string, string>();

  constructor(
    private readonly messageService: MessageService,
    private readonly chatRoomService: ChatRoomService,
    private readonly tokenHandleService: TokenHandleService,
  ) {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) throw new WsException('No token provided');

      const user = await this.tokenHandleService.verifyToken(token);
      this.socketUserMap.set(client.id, user.email);
      this.logger.log(`Client connected: ${client.id} (${user.email})`);
    } catch (err) {
      this.logger.warn(`Rejected connection ${client.id}: ${err.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const email = this.socketUserMap.get(client.id);
    this.socketUserMap.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (${email ?? 'unknown'})`);
  }

  // ─── Room subscription ─────────────────────────────────────────────────────

  /**
   * Client emits: join_room { roomId }
   * Server joins the socket to the Socket.IO room so it receives broadcasts.
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userEmail = this.getUser(client);
    try {
      await this.chatRoomService.findOne(payload.roomId, userEmail);
      client.join(payload.roomId);
      this.logger.log(`${userEmail} joined room ${payload.roomId}`);
      return { event: 'joined_room', roomId: payload.roomId };
    } catch (err) {
      return this.emitError(client, err.message);
    }
  }

  /**
   * Client emits: leave_room { roomId }
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    client.leave(payload.roomId);
    return { event: 'left_room', roomId: payload.roomId };
  }

  // ─── Messaging ─────────────────────────────────────────────────────────────

  /**
   * Client emits: send_message { roomId, text, type?, attachments?, replyToMessageId? }
   * Persists the message and broadcasts `new_message` to the room.
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const userEmail = this.getUser(client);
    try {
      const message = await this.messageService.send(dto, userEmail);
      this.server.to(dto.roomId).emit('new_message', message);
      return { event: 'message_sent', data: message };
    } catch (err) {
      return this.emitError(client, err.message);
    }
  }

  /**
   * Client emits: edit_message { messageId, text }
   * Persists the edit and broadcasts `message_edited` to the room.
   */
  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; text: string },
  ) {
    const userEmail = this.getUser(client);
    try {
      const dto: EditMessageDto = { text: payload.text };
      const updated = await this.messageService.edit(payload.messageId, dto, userEmail);
      this.server.to(updated.roomId).emit('message_edited', updated);
      return { event: 'message_edited', data: updated };
    } catch (err) {
      return this.emitError(client, err.message);
    }
  }

  /**
   * Client emits: delete_message { messageId }
   * Soft-deletes and broadcasts `message_deleted` to the room.
   */
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string },
  ) {
    const userEmail = this.getUser(client);
    try {
      // Fetch before delete so we know the roomId
      const message = await this.messageService.findOne(payload.messageId, userEmail);
      await this.messageService.remove(payload.messageId, userEmail);
      this.server
        .to(message.roomId)
        .emit('message_deleted', { messageId: payload.messageId, roomId: message.roomId });
      return { event: 'message_deleted' };
    } catch (err) {
      return this.emitError(client, err.message);
    }
  }

  // ─── Reactions ─────────────────────────────────────────────────────────────

  /**
   * Client emits: react { messageId, emoji }
   * Toggles reaction and broadcasts `reaction_updated` to the room.
   */
  @SubscribeMessage('react')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; emoji: string },
  ) {
    const userEmail = this.getUser(client);
    try {
      const dto: ReactToMessageDto = { emoji: payload.emoji };
      const updated = await this.messageService.toggleReaction(payload.messageId, dto, userEmail);
      this.server.to(updated.roomId).emit('reaction_updated', updated);
      return { event: 'reaction_updated', data: updated };
    } catch (err) {
      return this.emitError(client, err.message);
    }
  }

  // ─── Typing indicators ─────────────────────────────────────────────────────

  /**
   * Client emits: typing { roomId }
   * Broadcasts to all room members except the sender.
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userEmail = this.getUser(client);
    client.to(payload.roomId).emit('user_typing', {
      roomId: payload.roomId,
      userEmail,
    });
  }

  /**
   * Client emits: stop_typing { roomId }
   */
  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userEmail = this.getUser(client);
    client.to(payload.roomId).emit('user_stop_typing', {
      roomId: payload.roomId,
      userEmail,
    });
  }

  // ─── Read receipts ─────────────────────────────────────────────────────────

  /**
   * Client emits: mark_read { roomId }
   * Marks all messages as read and broadcasts to room members.
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userEmail = this.getUser(client);
    try {
      const result = await this.messageService.markRoomAsRead(payload.roomId, userEmail);
      this.server.to(payload.roomId).emit('room_read', {
        roomId: payload.roomId,
        userEmail,
        updatedCount: result.updated,
      });
      return { event: 'room_read', ...result };
    } catch (err) {
      return this.emitError(client, err.message);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private extractToken(client: Socket): string | null {
    // Try Authorization header first, then handshake auth object
    const authHeader =
      client.handshake.headers['authorization'] as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return (client.handshake.auth?.token as string) ?? null;
  }

  private getUser(client: Socket): string {
    const email = this.socketUserMap.get(client.id);
    if (!email) throw new WsException('Unauthenticated');
    return email;
  }

  private emitError(client: Socket, message: string) {
    client.emit('error', { message });
    return { event: 'error', message };
  }
}