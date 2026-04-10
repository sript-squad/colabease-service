import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  Task,
  TaskDocument,
  TaskStatus,
  TaskPriority,
} from './schemas/task.schema';
import { ProjectManagementService } from '../project-management/project-management.service';

@Injectable()
export class TaskManagementService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private readonly projectService: ProjectManagementService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userEmail: string): Promise<TaskDocument> {
    // Verify project access
    await this.projectService.findOne(createTaskDto.projectId, userEmail);
    
    const createdTask = new this.taskModel(createTaskDto);
    return createdTask.save();
  }

  async findAll(
    userEmail: string,
    projectId?: string,
    status?: TaskStatus,
    priority?: TaskPriority,
    assigneeId?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<TaskDocument[]> {
    // If projectId is provided, verify access
    if (projectId) {
      await this.projectService.findOne(projectId, userEmail);
    }

    const filters: any = {};
    if (projectId) filters.projectId = projectId;
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assigneeId) filters.assigneeId = assigneeId;

    // If no projectId, we need to filter tasks by projects the user has access to
    if (!projectId) {
      const projects = await this.projectService.findAll(userEmail);
      const projectIds = projects.map(p => p._id);
      filters.projectId = { $in: projectIds };
    }

    return this.taskModel
      .find(filters)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async findOne(id: string, userEmail: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    // Verify project access
    await this.projectService.findOne(task.projectId, userEmail);
    
    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userEmail: string,
  ): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Verify project access
    await this.projectService.findOne(task.projectId, userEmail);

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, {
        returnDocument: 'after',
        runValidators: true,
      })
      .exec();
    return updatedTask;
  }

  async remove(id: string, userEmail: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Verify project access
    await this.projectService.findOne(task.projectId, userEmail);

    const deletedTask = await this.taskModel.findByIdAndDelete(id).exec();
    return deletedTask;
  }
}
