import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll(userEmail: string, status?: string): Promise<ProjectDocument[]> {
    const filter: any = {
      $or: [{ ownerId: userEmail }, { members: userEmail }],
    };
    if (status) filter.status = status;
    return this.projectModel.find(filter).exec();
  }

  async findOne(id: string, userEmail: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException('Project not found: ' + id);
    }
    const isOwner = project.ownerId === userEmail;
    const isMember = project.members?.includes(userEmail);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userEmail: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (project.ownerId !== userEmail) {
      throw new ForbiddenException('Only the project owner can update project details');
    }

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { returnDocument: 'after' })
      .exec();

    return updatedProject;
  }

  async remove(id: string, userEmail: string): Promise<{ message: string }> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (project.ownerId !== userEmail) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.projectModel.findByIdAndDelete(id).exec();
    return { message: `Project "${project.name}" deleted successfully` };
  }
}
