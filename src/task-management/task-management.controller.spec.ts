import { Test, TestingModule } from '@nestjs/testing';
import { TaskManagementController } from './task-management.controller';
import { TaskManagementService } from './task-management.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './schemas/task.schema';

describe('TaskManagementController', () => {
  let controller: TaskManagementController;
  let service: TaskManagementService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTask = {
    _id: 'some-id',
    title: 'Test Task',
    status: TaskStatus.OPEN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskManagementController],
      providers: [
        {
          provide: TaskManagementService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TaskManagementController>(TaskManagementController);
    service = module.get<TaskManagementService>(TaskManagementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto: CreateTaskDto = { title: 'New Task' };
      mockService.create.mockResolvedValue(mockTask);

      expect(await controller.create(dto)).toEqual(mockTask);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      mockService.findAll.mockResolvedValue([mockTask]);
      expect(await controller.findAll()).toEqual([mockTask]);
    });
  });

  describe('findOne', () => {
    it('should return a task', async () => {
      mockService.findOne.mockResolvedValue(mockTask);
      expect(await controller.findOne('some-id')).toEqual(mockTask);
      expect(mockService.findOne).toHaveBeenCalledWith('some-id');
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const dto: UpdateTaskDto = { title: 'Updated' };
      mockService.update.mockResolvedValue({ ...mockTask, title: 'Updated' });
      expect(await controller.update('some-id', dto)).toEqual({
        ...mockTask,
        title: 'Updated',
      });
      expect(mockService.update).toHaveBeenCalledWith('some-id', dto);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      mockService.remove.mockResolvedValue(mockTask);
      expect(await controller.remove('some-id')).toEqual(mockTask);
      expect(mockService.remove).toHaveBeenCalledWith('some-id');
    });
  });
});
