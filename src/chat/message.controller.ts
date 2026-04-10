import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { User } from '../common/decorators/user.decorator';
import { SendMessageDto, GetMessagesQueryDto, EditMessageDto, ReactToMessageDto } from './dtos/message.dto';


@Controller('chat/messages')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * POST /chat/messages
   * Send a message to a room.
   */
  @Post()
  send(@Body() dto: SendMessageDto, @User() userEmail: string) {
    return this.messageService.send(dto, userEmail);
  }

  /**
   * GET /chat/messages/:roomId
   * Fetch paginated message history for a room.
   * Supports cursor-based pagination via ?before=<ISO date or message ID>&limit=<n>
   */
  @Get(':roomId')
  getMessages(
    @Param('roomId') roomId: string,
    @User() userEmail: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.messageService.getMessages(
      roomId,
      userEmail,
      query.before,
      query.limit,
    );
  }

  /**
   * PATCH /chat/messages/:id
   * Edit the text of a message. Only the original sender can edit.
   */
  @Patch(':id')
  edit(
    @Param('id') id: string,
    @Body() dto: EditMessageDto,
    @User() userEmail: string,
  ) {
    return this.messageService.edit(id, dto, userEmail);
  }

  /**
   * DELETE /chat/messages/:id
   * Soft-delete a message. The sender or room creator may delete.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @User() userEmail: string) {
    return this.messageService.remove(id, userEmail);
  }

  /**
   * POST /chat/messages/:id/reactions
   * Toggle an emoji reaction on a message. Calling again with the same
   * emoji removes the reaction (toggle behaviour).
   */
  @Post(':id/reactions')
  toggleReaction(
    @Param('id') id: string,
    @Body() dto: ReactToMessageDto,
    @User() userEmail: string,
  ) {
    return this.messageService.toggleReaction(id, dto, userEmail);
  }

  /**
   * PATCH /chat/messages/rooms/:roomId/read
   * Mark all messages in a room as read by the authenticated user.
   */
  @Patch('rooms/:roomId/read')
  markAsRead(@Param('roomId') roomId: string, @User() userEmail: string) {
    return this.messageService.markRoomAsRead(roomId, userEmail);
  }
}