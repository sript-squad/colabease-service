import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from '../schemas/task.schema';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
