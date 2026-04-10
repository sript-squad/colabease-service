import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system', // e.g. "Alice added Bob to the room"
}

@Schema()
class Attachment {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  fileName: string;

  @Prop()
  mimeType?: string;

  @Prop()
  size?: number; // bytes
}

@Schema()
class Reaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ type: [String], default: [] })
  reactedBy: string[]; // emails of users who reacted with this emoji
}

@Schema({ timestamps: true })
export class Message {
  // Explicitly declared so TypeScript resolves them from HydratedDocument.
  // Mongoose's `timestamps: true` creates these at runtime; without @Prop they
  // are invisible to the compiler.
  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ required: true })
  roomId: string; // Reference to ChatRoom._id

  @Prop({ required: true })
  senderEmail: string;

  @Prop({ required: true, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop()
  text?: string;

  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[];

  @Prop({ type: [Reaction], default: [] })
  reactions: Reaction[];

  @Prop()
  editedAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  replyToMessageId?: string; // Reference to another Message._id for threading

  // Tracks which users have seen this message
  @Prop({ type: [String], default: [] })
  readBy: string[]; // emails
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ roomId: 1, createdAt: -1 }); // Fast room history queries
MessageSchema.index({ senderEmail: 1 });