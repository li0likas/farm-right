import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CommentService } from '../comment/comment.service';
import { EquipmentService } from 'src/equipment/equipment.service';
import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { Prisma } from '@prisma/client';

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
  removeParticipant: jest.fn(),
  findAllTasksForField: jest.fn(),
  createTaskForField: jest.fn()
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
  let taskService: TaskService;
  let commentService: CommentService;
  let equipmentService: EquipmentService;

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
    taskService = module.get<TaskService>(TaskService);
    commentService = module.get<CommentService>(CommentService);
    equipmentService = module.get<EquipmentService>(EquipmentService);
    
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

  describe('findOne', () => {
    it('should return a task by ID', async () => {
      const taskId = '5';
      const mockTask = { id: 5, description: 'Test Task' };
      mockTaskService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(
        { headers: { 'x-selected-farm-id': '1' } } as any, 
        taskId
      );
      
      expect(taskService.findOne).toHaveBeenCalledWith(5, 1);
      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException for invalid farm ID', async () => {
      await expect(controller.findOne(
        { headers: { 'x-selected-farm-id': 'invalid' } } as any, 
        '5'
      )).rejects.toThrow(ForbiddenException);
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

  describe('update', () => {
    it('should update a task and return the updated task', async () => {
      const taskId = '5';
      const updateDto = { description: 'Updated Task' };
      const updatedTask = { id: 5, description: 'Updated Task' };
      
      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId,
        updateDto
      );

      expect(taskService.update).toHaveBeenCalledWith(5, updateDto, 1);
      expect(result).toEqual(updatedTask);
    });

    it('should throw ForbiddenException for invalid farm ID', async () => {
      await expect(controller.update(
        { headers: { 'x-selected-farm-id': 'invalid' } } as any,
        '5',
        {}
      )).rejects.toThrow(ForbiddenException);
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
    
    it('should handle service errors and throw UnprocessableEntityException', async () => {
      mockTaskService.delete.mockImplementation(() => {
        throw new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
          code: 'P2003',
          clientVersion: '4.0.0',
        });
      });
      
      await expect(controller.delete(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        '1'
      )).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('changeTaskStatus', () => {
    it('should change task status', async () => {
      const taskId = '5';
      const statusId = 2;
      const updatedTask = { id: 5, statusId: 2 };
      
      mockTaskService.changeTaskStatus.mockResolvedValue(updatedTask);

      const result = await controller.changeTaskStatus(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId,
        statusId
      );

      expect(taskService.changeTaskStatus).toHaveBeenCalledWith(5, 2, 1);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('getTaskParticipants', () => {
    it('should return participants for a task', async () => {
      const taskId = '3';
      const participants = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ];
      
      mockTaskService.getTaskParticipants.mockResolvedValue(participants);

      const result = await controller.getParticipants(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId
      );

      expect(taskService.getTaskParticipants).toHaveBeenCalledWith(3, 1);
      expect(result).toEqual(participants);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to task', async () => {
      const taskId = '3';
      const userId = 2;
      const addedParticipant = { id: 1, taskId: 3, farmMemberId: 5 };
      
      mockTaskService.addParticipant.mockResolvedValue(addedParticipant);

      const result = await controller.addParticipant(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId,
        userId
      );

      expect(taskService.addParticipant).toHaveBeenCalledWith(3, userId, 1);
      expect(result).toEqual(addedParticipant);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from task', async () => {
      const taskId = '3';
      const userId = '2';
      const removedParticipant = { id: 1, taskId: 3, farmMemberId: 5 };
      
      mockTaskService.removeParticipant.mockResolvedValue(removedParticipant);

      const result = await controller.removeParticipant(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId,
        userId
      );

      expect(taskService.removeParticipant).toHaveBeenCalledWith(3, 2, 1);
      expect(result).toEqual(removedParticipant);
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed', async () => {
      const taskId = '3';
      const body = {
        minutesWorked: 120,
        equipmentData: { 1: 10, 2: 15 } // Equipment IDs with fuel used
      };
      const completionResult = { message: 'Task marked as completed' };
      
      mockTaskService.markAsCompleted.mockResolvedValue(completionResult);

      const result = await controller.completeTask(
        taskId,
        body,
        { headers: { 'x-selected-farm-id': '1' } } as any
      );

      expect(taskService.markAsCompleted).toHaveBeenCalledWith(
        3, 
        1, 
        body.minutesWorked, 
        body.equipmentData
      );
      expect(result).toEqual(completionResult);
    });
  });

  describe('findAllComments', () => {
    it('should return all comments for a task', async () => {
      const taskId = '3';
      const comments = [{ id: 1, content: 'Comment 1' }];
      
      mockCommentService.findAll.mockResolvedValue(comments);

      const result = await controller.findAllComments(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId
      );

      expect(commentService.findAll).toHaveBeenCalledWith(3, 1);
      expect(result).toEqual(comments);
    });
  });

  describe('createComment', () => {
    it('should create a comment for a task', async () => {
      const taskId = '3';
      const createCommentDto: CreateCommentDto = {
        taskId: 3,
        content: 'New Comment'
      };
      const comment = { id: 1, content: 'New Comment', taskId: 3 };
      
      mockCommentService.create.mockResolvedValue(comment);

      const result = await controller.createComment(
        { headers: { 'x-selected-farm-id': '1' }, user: { id: 5 } } as any,
        taskId,
        createCommentDto
      );

      expect(commentService.create).toHaveBeenCalledWith(
        { ...createCommentDto, taskId: 3 }, 
        1, 
        5
      );
      expect(result).toEqual(comment);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const taskId = '3';
      const commentId = '7';
      
      mockCommentService.delete.mockResolvedValue(undefined);

      await controller.deleteComment(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId,
        commentId
      );

      expect(commentService.delete).toHaveBeenCalledWith(7, 1);
    });
  });

  describe('getEquipmentForTask', () => {
    it('should return equipment list for task', async () => {
      const taskId = '3';
      const equipmentList = [{ id: 1, name: 'Tractor' }];
      
      mockEquipmentService.getEquipmentForTask.mockResolvedValue(equipmentList);

      const result = await controller.getEquipmentForTask(
        { headers: { 'x-selected-farm-id': '1' } } as any, 
        taskId
      );
      
      expect(equipmentService.getEquipmentForTask).toHaveBeenCalledWith(3, 1);
      expect(result).toEqual(equipmentList);
    });
  });

  describe('addEquipmentToTask', () => {
    it('should add equipment to task', async () => {
      const taskId = '3';
      const equipmentId = 5;
      const addedEquipment = { id: 1, taskId: 3, equipmentId: 5 };
      
      mockEquipmentService.addEquipmentToTask.mockResolvedValue(addedEquipment);

      const result = await controller.addEquipmentToTask(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId, 
        equipmentId
      );

      expect(equipmentService.addEquipmentToTask).toHaveBeenCalledWith(3, equipmentId, 1);
      expect(result).toEqual(addedEquipment);
    });
  });

  describe('removeEquipmentFromTask', () => {
    it('should remove equipment from task', async () => {
      const taskId = '3';
      const equipmentId = '5';
      const removedEquipment = { id: 1, taskId: 3, equipmentId: 5 };
      
      mockEquipmentService.removeEquipmentFromTask.mockResolvedValue(removedEquipment);

      const result = await controller.removeEquipmentFromTask(
        { headers: { 'x-selected-farm-id': '1' } } as any,
        taskId, 
        equipmentId
      );

      expect(equipmentService.removeEquipmentFromTask).toHaveBeenCalledWith(3, 5, 1);
      expect(result).toEqual(removedEquipment);
    });
  });
});