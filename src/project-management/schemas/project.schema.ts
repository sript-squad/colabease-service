import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  ownerId: string; // To simulate an owner
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
