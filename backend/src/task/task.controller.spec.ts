import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CommentService } from '../comment/comment.service';
import { EquipmentService } from 'src/equipment/equipment.service';
import { ForbiddenException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

const mockTaskService = {
  findAll: jest.fn(),
  getCompletedTasks: jest.fn(),
  create: jest.fn(),
  markAsCompleted: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  changeTaskStatus: jest.fn(),
  getTaskParticipants: jest.fn(),
  addParticipant: jest.fn(),
  removeParticipant: jest.fn()
};

const mockCommentService = {
  findAll: jest.fn(),
  create: jest.fn(),
  delete: jest.fn()
};

const mockEquipmentService = {
  getEquipmentForTask: jest.fn(),
  addEquipmentToTask: jest.fn(),
  removeEquipmentFromTask: jest.fn()
};

const mockReflector = {
  get: jest.fn().mockReturnValue(['TASK_READ']),
};

const mockPrismaService = {
  farmMember: {
    findUnique: jest.fn().mockResolvedValue({
      role: {
        farmPermissions: [{ permission: { name: 'TASK_READ' } }],
      },
    }),
  },
};

describe('TaskController', () => {
  let controller: TaskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: CommentService, useValue: mockCommentService },
        { provide: EquipmentService, useValue: mockEquipmentService },
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TaskController>(TaskController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tasks for a valid farm ID', async () => {
      const mockTasks = [{ id: 1, description: 'Task 1' }];
      mockTaskService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll({ headers: { 'x-selected-farm-id': '1' } } as any);
      expect(result).toBe(mockTasks);
      expect(mockTaskService.findAll).toHaveBeenCalledWith(1);
    });

    it('should throw ForbiddenException for invalid farm ID', async () => {
      await expect(controller.findAll({ headers: { 'x-selected-farm-id': 'invalid' } } as any))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCompletedTasks', () => {
    it('should return completed task stats', async () => {
      const stats = { completedTasks: 3, totalTasks: 5 };
      mockTaskService.getCompletedTasks.mockResolvedValue(stats);

      const result = await controller.getCompletedTasks({ headers: { 'x-selected-farm-id': '2' } } as any);
      expect(result).toEqual(stats);
    });
  });

  describe('getEquipmentForTask', () => {
    it('should return equipment list for task', async () => {
      const equipmentList = [{ id: 1, name: 'Tractor' }];
      mockEquipmentService.getEquipmentForTask.mockResolvedValue(equipmentList);

      const result = await controller.getEquipmentForTask({ headers: { 'x-selected-farm-id': '1' } } as any, '1');
      expect(result).toEqual(equipmentList);
    });
  });

  describe('create', () => {
    it('should create a task and return it', async () => {
      const createDto: CreateTaskDto = {
        typeId: 1,
        description: 'New Task',
        statusId: 1,
        fieldId: 1,
        seasonId: 1,
        equipmentIds: [],
      };

      const createdTask = { id: 1, ...createDto };
      mockTaskService.create.mockResolvedValue(createdTask);

      const result = await controller.create(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        createDto
      );

      expect(result).toEqual(createdTask);
    });

    it('should throw if farm ID is invalid', async () => {
      await expect(controller.create({ headers: { 'x-selected-farm-id': 'abc' } } as any, {} as any))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete the task', async () => {
      const deleted = { id: 1, deleted: true };
      mockTaskService.delete.mockResolvedValue(deleted);

      const result = await controller.delete({ headers: { 'x-selected-farm-id': '1' } } as any, '1');
      expect(result).toEqual(deleted);
      expect(mockTaskService.delete).toHaveBeenCalledWith(1, 1);
    });
  });
});
