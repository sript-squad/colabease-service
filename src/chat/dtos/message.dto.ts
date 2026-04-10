import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../schemas/message.schema';

// ─── Attachment ──────────────────────────────────────────────────────────────

export class AttachmentDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  size?: number;
}

// ─── Send Message ─────────────────────────────────────────────────────────────

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsString()
  replyToMessageId?: string;
}

// ─── Edit Message ─────────────────────────────────────────────────────────────

export class EditMessageDto {
  @IsNotEmpty()
  @IsString()
  text: string;
}

// ─── Reaction ─────────────────────────────────────────────────────────────────

export class ReactToMessageDto {
  @IsNotEmpty()
  @IsString()
  emoji: string;
}

// ─── Query Messages ───────────────────────────────────────────────────────────

export class GetMessagesQueryDto {
  @IsOptional()
  @IsString()
  before?: string; // ISO date or message ID — for cursor-based pagination

  @IsOptional()
  @IsString()
  limit?: string; // defaults to 30
}