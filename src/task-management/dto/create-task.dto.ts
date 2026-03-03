import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsMongoId() // Typically Project ID is a Mongo ObjectId
  projectId: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString() // User IDs might be strings (auth0, etc) or ObjectIds
  assigneeId?: string;

  @IsNotEmpty()
  @IsString()
  reporterId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
