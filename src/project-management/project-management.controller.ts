import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProjectManagementService } from './project-management.service';
import { CreateProjectDto } from './dto/create-project.dto';

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
}
