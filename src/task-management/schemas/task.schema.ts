import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  projectId: string; // Reference to Project (handled by other module)

  @Prop({ default: TaskStatus.OPEN, enum: TaskStatus })
  status: TaskStatus;

  @Prop({ default: TaskPriority.MEDIUM, enum: TaskPriority })
  priority: TaskPriority;

  @Prop()
  assigneeId?: string; // User ID

  @Prop({ required: true })
  reporterId: string; // User ID of creator

  @Prop()
  startDate?: Date;

  @Prop()
  dueDate?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
