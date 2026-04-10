import { Body, Controller, Get, Post, Patch, Param, Delete, Query, ValidationPipe, UsePipes, Req } from '@nestjs/common';
import { ProjectManagementService } from './project-management.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('projects')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ProjectManagementController {
  constructor(
    private readonly projectManagementService: ProjectManagementService,
  ) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectManagementService.create(createProjectDto);
  }

  @Get()
  findAll(@User() user: string, @Query('status') status?: string) {
    return this.projectManagementService.findAll(user, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: string) {
    return this.projectManagementService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @User() user: string) {
    return this.projectManagementService.update(id, updateProjectDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: string) {
    return this.projectManagementService.remove(id, user);
  }
}
