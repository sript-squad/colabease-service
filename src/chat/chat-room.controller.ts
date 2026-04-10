import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChatRoomService } from './chat-room.service';
import { User } from '../common/decorators/user.decorator';
import { CreateChatRoomDto, UpdateChatRoomDto, ManageMembersDto } from './dtos/chat-room.dto';


@Controller('chat/rooms')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatRoomController {
  constructor(private readonly chatRoomService: ChatRoomService) {}

  /**
   * POST /chat/rooms
   * Create a new chat room (direct, group, or project-linked).
   */
  @Post()
  create(@Body() dto: CreateChatRoomDto, @User() userEmail: string) {
    return this.chatRoomService.create(dto, userEmail);
  }

  /**
   * GET /chat/rooms
   * List all rooms the authenticated user belongs to.
   */
  @Get()
  findAll(@User() userEmail: string) {
    return this.chatRoomService.findAllForUser(userEmail);
  }

  /**
   * GET /chat/rooms/:id
   * Get a single room by ID.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @User() userEmail: string) {
    return this.chatRoomService.findOne(id, userEmail);
  }

  /**
   * GET /chat/rooms/project/:projectId
   * Get the chat room linked to a specific project.
   */
  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @User() userEmail: string) {
    return this.chatRoomService.findByProjectId(projectId, userEmail);
  }

  /**
   * PATCH /chat/rooms/:id
   * Update room name, description, or archived state.
   * Only the room creator can do this.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChatRoomDto,
    @User() userEmail: string,
  ) {
    return this.chatRoomService.update(id, dto, userEmail);
  }

  /**
   * POST /chat/rooms/:id/members
   * Add members to a group or project room.
   * Only the room creator can do this.
   */
  @Post(':id/members')
  addMembers(
    @Param('id') id: string,
    @Body() dto: ManageMembersDto,
    @User() userEmail: string,
  ) {
    return this.chatRoomService.addMembers(id, dto, userEmail);
  }

  /**
   * DELETE /chat/rooms/:id/members
   * Remove members from a group or project room.
   * Only the room creator can do this.
   */
  @Delete(':id/members')
  removeMembers(
    @Param('id') id: string,
    @Body() dto: ManageMembersDto,
    @User() userEmail: string,
  ) {
    return this.chatRoomService.removeMembers(id, dto, userEmail);
  }

  /**
   * DELETE /chat/rooms/:id/leave
   * The authenticated user leaves a room voluntarily.
   */
  @Delete(':id/leave')
  leave(@Param('id') id: string, @User() userEmail: string) {
    return this.chatRoomService.leaveRoom(id, userEmail);
  }

  /**
   * DELETE /chat/rooms/:id
   * Delete the room entirely. Only the creator can do this.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @User() userEmail: string) {
    return this.chatRoomService.remove(id, userEmail);
  }
}