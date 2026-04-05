import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project & Document>;

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status: ProjectStatus;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ type: [String], default: [] }) // array of member user IDs
  members: string[];

  @Prop({ required: true })
  ownerId: string; // To simulate an owner
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
