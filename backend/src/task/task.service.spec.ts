import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from '../../src/task/task.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('TaskService - Additional Tests', () => {
  let service: TaskService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    field: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    farmMember: {
      findFirst: jest.fn(),
    },
    taskParticipant: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const updateData = { description: 'Updated Task' };
      const mockTask = { id: taskId, description: 'Original Task' };
      const mockUpdatedTask = { id: taskId, description: 'Updated Task' };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockUpdatedTask);

      // Act
      const result = await service.update(taskId, updateData, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
      });
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const updateData = { description: 'Updated Task' };

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(taskId, updateData, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
      });
      expect(mockPrismaService.task.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a task successfully', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const mockTask = { id: taskId, description: 'Task to delete' };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      // Act
      const result = await service.delete(taskId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
      });
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(taskId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
      });
      expect(mockPrismaService.task.delete).not.toHaveBeenCalled();
    });
  });

  describe('changeTaskStatus', () => {
    it('should change task status successfully', async () => {
      // Arrange
      const taskId = 1;
      const newStatusId = 2;
      const farmId = 1;
      const mockTask = { id: taskId, statusId: 1 };
      const mockUpdatedTask = { id: taskId, statusId: newStatusId };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockUpdatedTask);

      // Act
      const result = await service.changeTaskStatus(taskId, newStatusId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: taskId,
          field: {
            farmId,
          },
        },
      });
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { statusId: newStatusId },
      });
      expect(result).toEqual(mockUpdatedTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const newStatusId = 2;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changeTaskStatus(taskId, newStatusId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: taskId,
          field: {
            farmId,
          },
        },
      });
      expect(mockPrismaService.task.update).not.toHaveBeenCalled();
    });
  });

  describe('getCompletedTasks', () => {
    it('should return completed and total task counts', async () => {
      // Arrange
      const farmId = 1;
      const mockTasks = [
        { status: { name: 'Completed' } },
        { status: { name: 'Completed' } },
        { status: { name: 'Pending' } },
        { status: { name: 'Canceled' } },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      // Act
      const result = await service.getCompletedTasks(farmId);

      // Assert
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { field: { farmId } },
        select: { status: true },
      });
      expect(result).toEqual({
        completedTasks: 2,
        totalTasks: 4,
      });
    });

    it('should handle empty task list', async () => {
      // Arrange
      const farmId = 1;
      mockPrismaService.task.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getCompletedTasks(farmId);

      // Assert
      expect(result).toEqual({
        completedTasks: 0,
        totalTasks: 0,
      });
    });
  });

  describe('getTaskParticipants', () => {
    it('should return task participants', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const mockTask = {
        id: taskId,
        participants: [
          {
            farmMember: {
              user: { id: 1, username: 'user1' },
            },
          },
          {
            farmMember: {
              user: { id: 2, username: 'user2' },
            },
          },
        ],
      };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);

      // Act
      const result = await service.getTaskParticipants(taskId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
        include: {
          participants: {
            include: {
              farmMember: {
                include: { user: true },
              },
            },
          },
        },
      });
      expect(result).toEqual([
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
      ]);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTaskParticipants(taskId, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addParticipant', () => {
    it('should add participant to task', async () => {
      // Arrange
      const taskId = 1;
      const userId = 1;
      const farmId = 1;
      const mockTask = { id: taskId };
      const mockFarmMember = { id: 5, userId, farmId };
      const mockTaskParticipant = { id: 1, taskId, farmMemberId: mockFarmMember.id };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(mockFarmMember);
      mockPrismaService.taskParticipant.create.mockResolvedValue(mockTaskParticipant);

      // Act
      const result = await service.addParticipant(taskId, userId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
      });
      expect(mockPrismaService.farmMember.findFirst).toHaveBeenCalledWith({
        where: { userId, farmId },
      });
      expect(mockPrismaService.taskParticipant.create).toHaveBeenCalledWith({
        data: {
          taskId,
          farmMemberId: mockFarmMember.id,
        },
      });
      expect(result).toEqual(mockTaskParticipant);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const userId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addParticipant(taskId, userId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.farmMember.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.taskParticipant.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user is not a farm member', async () => {
      // Arrange
      const taskId = 1;
      const userId = 1;
      const farmId = 1;
      const mockTask = { id: taskId };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addParticipant(taskId, userId, farmId)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.taskParticipant.create).not.toHaveBeenCalled();
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from task', async () => {
      // Arrange
      const taskId = 1;
      const userId = 1;
      const farmId = 1;
      const mockTask = { id: taskId };
      const mockFarmMember = { id: 5, userId, farmId };
      const mockTaskParticipant = { id: 1, taskId, farmMemberId: mockFarmMember.id };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(mockFarmMember);
      mockPrismaService.taskParticipant.delete.mockResolvedValue(mockTaskParticipant);

      // Act
      const result = await service.removeParticipant(taskId, userId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
      });
      expect(mockPrismaService.farmMember.findFirst).toHaveBeenCalledWith({
        where: { userId, farmId },
      });
      expect(mockPrismaService.taskParticipant.delete).toHaveBeenCalledWith({
        where: {
          taskId_farmMemberId: { taskId, farmMemberId: mockFarmMember.id },
        },
      });
      expect(result).toEqual(mockTaskParticipant);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const userId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeParticipant(taskId, userId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.farmMember.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.taskParticipant.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when farm member not found', async () => {
      // Arrange
      const taskId = 1;
      const userId = 1;
      const farmId = 1;
      const mockTask = { id: taskId };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeParticipant(taskId, userId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.taskParticipant.delete).not.toHaveBeenCalled();
    });
  });
});