import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskManagementController } from './task-management.controller';
import { TaskManagementService } from './task-management.service';
import { Task, TaskSchema } from './schemas/task.schema';
import { ProjectManagementModule } from '../project-management/project-management.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    ProjectManagementModule,
  ],
  controllers: [TaskManagementController],
  providers: [TaskManagementService],
})
export class TaskManagementModule {}
