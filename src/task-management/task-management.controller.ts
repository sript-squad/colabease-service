import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TaskManagementService } from './task-management.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { TaskStatus, TaskPriority } from './schemas/task.schema';

@Controller('tasks')
export class TaskManagementController {
  constructor(private readonly taskManagementService: TaskManagementService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskManagementService.create(createTaskDto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.taskManagementService.findAll(
      projectId,
      status,
      priority,
      assigneeId,
      page,
      limit,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.taskManagementService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskManagementService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.taskManagementService.remove(id);
  }
}
