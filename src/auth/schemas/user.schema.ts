import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  sub: string; // Cognito sub

  @Prop()
  username?: string;

  @Prop()
  fullName?: string;

  @Prop()
  role?: string;

  @Prop()
  bio?: string;

  @Prop()
  avatar?: string;

  @Prop()
  title?: string;

  @Prop()
  location?: string;

  @Prop()
  phone?: string;

  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop({ type: Object, default: {} })
  socialLinks?: Record<string, string>;
}

export const UserSchema = SchemaFactory.createForClass(User);
