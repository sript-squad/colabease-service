import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatRoomDocument = HydratedDocument<ChatRoom>;

export enum ChatRoomType {
  DIRECT = 'direct',       // 1-to-1 private chat
  PROJECT = 'project',     // Linked to a project (all project members)
  GROUP = 'group',         // Manual group chat
}

@Schema({ timestamps: true })
export class ChatRoom {
  @Prop({ required: true, enum: ChatRoomType, default: ChatRoomType.GROUP })
  type: ChatRoomType;

  @Prop()
  name?: string; // Optional - used for group rooms; direct rooms don't need a name

  @Prop()
  description?: string;

  @Prop({ type: [String], required: true, default: [] })
  members: string[]; // Array of user emails

  @Prop({ required: true })
  createdBy: string; // email of the creator

  @Prop()
  projectId?: string; // Populated when type === 'project'

  @Prop({ default: false })
  isArchived: boolean;

  // Denormalized: last message preview for listing rooms
  @Prop()
  lastMessageText?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  lastMessageBy?: string;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);

// Ensure only one project room per project
ChatRoomSchema.index(
  { projectId: 1 },
  { unique: true, partialFilterExpression: { type: ChatRoomType.PROJECT } },
);

// Ensure only one direct room between any two users
// We store members sorted so [a,b] === [b,a]
ChatRoomSchema.index(
  { type: 1, members: 1 },
  { partialFilterExpression: { type: ChatRoomType.DIRECT } },
);