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
import { User } from '../common/decorators/user.decorator';

@Controller('tasks')
export class TaskManagementController {
  constructor(private readonly taskManagementService: TaskManagementService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @User() user: string) {
    return this.taskManagementService.create(createTaskDto, user);
  }

  @Get()
  findAll(
    @User() user: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.taskManagementService.findAll(
      user,
      projectId,
      status,
      priority,
      assigneeId,
      page,
      limit,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string, @User() user: string) {
    return this.taskManagementService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @User() user: string,
  ) {
    return this.taskManagementService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string, @User() user: string) {
    return this.taskManagementService.remove(id, user);
  }
}
