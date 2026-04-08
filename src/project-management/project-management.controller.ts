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
    console.log('User email from @User decorator:', user);
    return this.projectManagementService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectManagementService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectManagementService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectManagementService.remove(id);
  }
}
