import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TaskManagementService } from './task-management.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('tasks')
export class TaskManagementController {
  constructor(private readonly taskManagementService: TaskManagementService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskManagementService.create(createTaskDto);
  }

  @Get()
  findAll() {
    return this.taskManagementService.findAll();
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
