import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TaskManagementService } from './task-management.service';
import { Task, TaskStatus } from './schemas/task.schema';
import { NotFoundException } from '@nestjs/common';

const mockTask = {
  _id: 'some-id',
  title: 'Test Task',
  description: 'Test Description',
  status: TaskStatus.OPEN,
  save: jest.fn(),
};

class MockTaskModel {
  constructor(private data: any) {
    this.save = jest.fn().mockResolvedValue({ ...this.data, _id: 'some-id' });
  }

  save: any;

  static find = jest.fn();
  static findById = jest.fn();
  static findByIdAndUpdate = jest.fn();
  static findByIdAndDelete = jest.fn();
}

describe('TaskManagementService', () => {
  let service: TaskManagementService;
  let model: typeof MockTaskModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskManagementService,
        {
          provide: getModelToken(Task.name),
          useValue: MockTaskModel,
        },
      ],
    }).compile();

    service = module.get<TaskManagementService>(TaskManagementService);
    model = module.get(getModelToken(Task.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { title: 'New Task' };
      const task = await service.create(dto as any);
      expect(task).toEqual(
        expect.objectContaining({ title: 'New Task', _id: 'some-id' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const result = [mockTask];
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(result),
      } as any);

      const tasks = await service.findAll();
      expect(tasks).toEqual(result);
    });
  });

  describe('findOne', () => {
    it('should find a task by id', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTask),
      } as any);

      const task = await service.findOne('some-id');
      expect(task).toEqual(mockTask);
    });

    it('should throw NotFoundException if not found', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('some-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockTask, title: 'Updated' }),
      } as any);

      const task = await service.update('some-id', { title: 'Updated' });
      expect(task.title).toEqual('Updated');
    });

    it('should throw NotFoundException if to-be-updated task not found', async () => {
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update('some-id', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTask),
      } as any);

      const task = await service.remove('some-id');
      expect(task).toEqual(mockTask);
    });

    it('should throw NotFoundException if to-be-deleted task not found', async () => {
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('some-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
