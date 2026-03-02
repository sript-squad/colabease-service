import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: TaskStatus.OPEN, enum: TaskStatus })
  status: TaskStatus;

  @Prop()
  assignedTo?: string; // Assuming user ID string for now

  @Prop()
  dueDate?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
