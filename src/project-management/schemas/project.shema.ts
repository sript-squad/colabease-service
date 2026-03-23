import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

export enum ProjectStatus {
    PLANNING = 'planning',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    ON_HOLD = 'on_hold',
    CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Project {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    description: string;

    @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.PLANNING })
    status: ProjectStatus;

    @Prop()
    startDate: Date;

    @Prop()
    endDate: Date;

    @Prop({ type: [String], default: [] })
    members: string[];

    @Prop({required: true})
    createdBy: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);