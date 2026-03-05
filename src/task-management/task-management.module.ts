import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskManagementController } from './task-management.controller';
import { TaskManagementService } from './task-management.service';
import { Task, TaskSchema } from './schemas/task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  controllers: [TaskManagementController],
  providers: [TaskManagementService],
})
export class TaskManagementModule {}
