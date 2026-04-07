import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectManagementService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectDocument> {
    const createdProject = new this.projectModel(createProjectDto);
    return createdProject.save();
  }

  async findAll(status?: string): Promise<ProjectDocument[]> {
    const filter = status ? { status } : {};
    return this.projectModel.find(filter).exec();
  }

  async findOne(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found: ' + id);
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
  const updatedProject = await this.projectModel
    .findByIdAndUpdate(id, updateProjectDto, { returnDocument: 'after' })
    .exec();

  if (!updatedProject) {
    throw new NotFoundException(`Project with ID "${id}" not found`);
  }
  return updatedProject;
}

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.projectModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }
    return { message: `Project "${result.name}" deleted successfully` };
  }

  async findOne(id: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async update(id: string, updateData: any): Promise<ProjectDocument> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true })
      .exec();
    if (!updatedProject) throw new NotFoundException(`Project with ID ${id} not found`);
    return updatedProject;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const deleted = await this.projectModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Project with ID ${id} not found`);
    return { success: true };
  }
}
