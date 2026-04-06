import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProjectManagementService } from './project-management.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('projects')
export class ProjectManagementController {
  constructor(
    private readonly projectManagementService: ProjectManagementService,
  ) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectManagementService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectManagementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.projectManagementService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() updateData: any) {
    return this.projectManagementService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.projectManagementService.remove(id);
  }
}
