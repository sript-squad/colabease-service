import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { ChatRoomType } from '../schemas/chat-room.schema';

// ─── Create Room ────────────────────────────────────────────────────────────

export class CreateChatRoomDto {
  @IsNotEmpty()
  @IsEnum(ChatRoomType)
  type: ChatRoomType;

  /**
   * Required when type === 'group'.
   * Omit for 'direct' (name is derived from the other member).
   * Omit for 'project' (name is derived from the project).
   */
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  /**
   * For 'direct': provide exactly one other member email.
   * For 'group' / 'project': provide one or more member emails.
   * The authenticated user is always added automatically.
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  members: string[];

  /**
   * Required when type === 'project'.
   */
  @IsOptional()
  @IsString()
  projectId?: string;
}

// ─── Update Room ─────────────────────────────────────────────────────────────

export class UpdateChatRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

// ─── Add / Remove Members ────────────────────────────────────────────────────

export class ManageMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  members: string[];
}