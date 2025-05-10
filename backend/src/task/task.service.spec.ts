import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from '../../src/task/task.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateTaskDto } from '../../src/task/dto/create-task.dto';

describe('TaskService', () => {
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
    equipment: {
      findMany: jest.fn(),
    },
    farmMember: {
      findFirst: jest.fn(),
    },
    taskParticipant: {
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    taskEquipment: {
      update: jest.fn(),
    }
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

  describe('create', () => {
    it('should create a task successfully', async () => {
      // Arrange
      const farmId = 1;
      const createTaskDto: CreateTaskDto = {
        typeId: 1,
        description: 'New task',
        statusId: 1,
        fieldId: 2,
        seasonId: 3,
        equipmentIds: [4, 5]
      };
      
      const mockField = { id: 2, name: 'Test Field', farmId };
      const mockEquipment = [{ id: 4 }, { id: 5 }];
      const mockCreatedTask = { id: 1, ...createTaskDto };

      mockPrismaService.field.findFirst.mockResolvedValue(mockField);
      mockPrismaService.equipment.findMany.mockResolvedValue(mockEquipment);
      mockPrismaService.task.create.mockResolvedValue(mockCreatedTask);

      // Act
      const result = await service.create(createTaskDto, farmId);

      // Assert
      expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
        where: { id: 2, farmId }
      });
      
      expect(mockPrismaService.equipment.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [4, 5] },
          farmId,
        },
      });
      
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: {
          description: 'New task',
          dueDate: null,
          completionDate: null,
          field: { connect: { id: 2 } },
          type: { connect: { id: 1 } },
          status: { connect: { id: 1 } },
          season: { connect: { id: 3 } },
          equipments: {
            createMany: {
              data: [
                { equipmentId: 4 },
                { equipmentId: 5 }
              ],
            },
          },
        },
      });
      
      expect(result).toEqual(mockCreatedTask);
    });

    it('should throw NotFoundException if field not found in the farm', async () => {
      // Arrange
      const farmId = 1;
      const createTaskDto: CreateTaskDto = {
        typeId: 1,
        description: 'New task',
        statusId: 1,
        fieldId: 2,
        seasonId: 3,
        equipmentIds: []
      };

      mockPrismaService.field.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createTaskDto, farmId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if equipment does not belong to farm', async () => {
      // Arrange
      const farmId = 1;
      const createTaskDto: CreateTaskDto = {
        typeId: 1,
        description: 'New task',
        statusId: 1,
        fieldId: 2,
        seasonId: 3,
        equipmentIds: [4, 5]
      };
      
      const mockField = { id: 2, name: 'Test Field', farmId };
      // Only one equipment found instead of two
      const mockEquipment = [{ id: 4 }];

      mockPrismaService.field.findFirst.mockResolvedValue(mockField);
      mockPrismaService.equipment.findMany.mockResolvedValue(mockEquipment);

      // Act & Assert
      await expect(service.create(createTaskDto, farmId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a farm', async () => {
      // Arrange
      const farmId = 1;
      const mockTasks = [
        { id: 1, description: 'Task 1' },
        { id: 2, description: 'Task 2' }
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      // Act
      const result = await service.findAll(farmId);

      // Assert
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          field: { farmId },
        },
        include: expect.any(Object)
      });
      
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findOne', () => {
    it('should return a task by ID', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const mockTask = { id: taskId, description: 'Task 1' };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);

      // Act
      const result = await service.findOne(taskId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
        include: expect.any(Object)
      });
      
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(taskId, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const updateData = { description: 'Updated task' };
      const mockTask = { id: taskId, description: 'Original task' };
      const mockUpdatedTask = { id: taskId, description: 'Updated task' };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockUpdatedTask);

      // Act
      const result = await service.update(taskId, updateData, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } }
      });
      
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: updateData,
      });
      
      expect(result).toEqual(mockUpdatedTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const updateData = { description: 'Updated task' };

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(taskId, updateData, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
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
        where: { id: taskId, field: { farmId } }
      });
      
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: taskId }
      });
      
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(taskId, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeTaskStatus', () => {
    it('should change task status', async () => {
      // Arrange
      const taskId = 1;
      const newStatusId = 2;
      const farmId = 1;
      const mockTask = { id: taskId, statusId: 1 };
      const mockUpdatedTask = { id: taskId, statusId: 2 };

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

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const newStatusId = 2;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.changeTaskStatus(taskId, newStatusId, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllTasksForField', () => {
    it('should return all tasks for a field', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;
      const mockField = { id: fieldId, farmId };
      const mockTasks = [{ id: 1 }, { id: 2 }];

      mockPrismaService.field.findFirst.mockResolvedValue(mockField);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      // Act
      const result = await service.findAllTasksForField(fieldId, farmId);

      // Assert
      expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
        where: { id: fieldId, farmId },
      });
      
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { fieldId },
        include: expect.any(Object)
      });
      
      expect(result).toEqual(mockTasks);
    });

    it('should throw NotFoundException if field not found', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;

      mockPrismaService.field.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAllTasksForField(fieldId, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCompletedTasks', () => {
    it('should return completed task stats', async () => {
      // Arrange
      const farmId = 1;
      const mockTasks = [
        { status: { name: 'Completed' } },
        { status: { name: 'Completed' } },
        { status: { name: 'Pending' } },
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
        totalTasks: 3,
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
          { farmMember: { user: { id: 1, username: 'user1' } } },
          { farmMember: { user: { id: 2, username: 'user2' } } }
        ]
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
                include: { user: true }
              }
            }
          }
        }
      });
      
      expect(result).toEqual([
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' }
      ]);
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTaskParticipants(taskId, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addParticipant', () => {
    it('should add a participant to a task', async () => {
      // Arrange
      const taskId = 1;
      const userId = 2;
      const farmId = 1;
      const mockTask = { id: taskId };
      const mockFarmMember = { id: 5, userId, farmId };
      const mockParticipant = { id: 1, taskId, farmMemberId: 5 };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(mockFarmMember);
      mockPrismaService.taskParticipant.create.mockResolvedValue(mockParticipant);

      // Act
      const result = await service.addParticipant(taskId, userId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } }
      });
      
      expect(mockPrismaService.farmMember.findFirst).toHaveBeenCalledWith({
        where: { userId, farmId }
      });
      
      expect(mockPrismaService.taskParticipant.create).toHaveBeenCalledWith({
        data: {
          taskId,
          farmMemberId: mockFarmMember.id
        }
      });
      
      expect(result).toEqual(mockParticipant);
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const userId = 2;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addParticipant(taskId, userId, farmId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is not a farm member', async () => {
      // Arrange
      const taskId = 1;
      const userId = 2;
      const farmId = 1;
      const mockTask = { id: taskId };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.addParticipant(taskId, userId, farmId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeParticipant', () => {
    it('should remove a participant from a task', async () => {
      // Arrange
      const taskId = 1;
      const userId = 2;
      const farmId = 1;
      const mockTask = { id: taskId };
      const mockFarmMember = { id: 5, userId, farmId };
      const mockDeletedParticipant = { id: 1, taskId, farmMemberId: 5 };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(mockFarmMember);
      mockPrismaService.taskParticipant.delete.mockResolvedValue(mockDeletedParticipant);

      // Act
      const result = await service.removeParticipant(taskId, userId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } }
      });
      
      expect(mockPrismaService.farmMember.findFirst).toHaveBeenCalledWith({
        where: { userId, farmId }
      });
      
      expect(mockPrismaService.taskParticipant.delete).toHaveBeenCalledWith({
        where: {
          taskId_farmMemberId: { taskId, farmMemberId: mockFarmMember.id }
        }
      });
      
      expect(result).toEqual(mockDeletedParticipant);
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const userId = 2;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeParticipant(taskId, userId, farmId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if farm member not found', async () => {
      // Arrange
      const taskId = 1;
      const userId = 2;
      const farmId = 1;
      const mockTask = { id: taskId };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);
      mockPrismaService.farmMember.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeParticipant(taskId, userId, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTaskForField', () => {
    it('should create a task for a field', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;
      const createTaskDto = { description: 'Field task' };
      const mockField = { id: fieldId, farmId };
      const mockCreatedTask = { id: 1, ...createTaskDto, fieldId };

      mockPrismaService.field.findFirst.mockResolvedValue(mockField);
      mockPrismaService.task.create.mockResolvedValue(mockCreatedTask);

      // Act
      const result = await service.createTaskForField(fieldId, createTaskDto as any, farmId);

      // Assert
      expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
        where: { id: fieldId, farmId }
      });
      
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: {
          ...createTaskDto,
          fieldId,
        }
      });
      
      expect(result).toEqual(mockCreatedTask);
    });

    it('should throw NotFoundException if field not found', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;
      const createTaskDto = { description: 'Field task' };

      mockPrismaService.field.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createTaskForField(fieldId, createTaskDto as any, farmId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark a task as completed', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const minutesWorked = 120;
      const equipmentData = { 5: 10, 6: 15 }; // Equipment IDs with fuel used
      
      const mockTask = { 
        id: taskId, 
        participants: [
          { farmMemberId: 2 },
          { farmMemberId: 3 }
        ],
        equipments: [
          { equipmentId: 5 },
          { equipmentId: 6 }
        ]
      };
      
      const mockUpdatedTask = { 
        id: taskId, 
        statusId: 1, 
        completionDate: expect.any(Date) 
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockUpdatedTask);
      mockPrismaService.taskParticipant.update.mockResolvedValue({});
      mockPrismaService.taskEquipment.update.mockResolvedValue({});

      // Act
      const result = await service.markAsCompleted(taskId, farmId, minutesWorked, equipmentData);

      // Assert
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
        include: {
          participants: true,
          equipments: true,
        },
      });
      
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
        data: {
          statusId: 1,
          completionDate: expect.any(Date),
        },
      });
      
      // Check that participants were updated
      expect(mockPrismaService.taskParticipant.update).toHaveBeenCalledTimes(2);
      
      // Check that equipment was updated
      expect(mockPrismaService.taskEquipment.update).toHaveBeenCalledTimes(2);
      
      expect(result).toEqual({ message: 'Task marked as completed' });
    });

    it('should throw NotFoundException if task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const minutesWorked = 120;
      const equipmentData = { 5: 10 };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.markAsCompleted(taskId, farmId, minutesWorked, equipmentData))
        .rejects.toThrow(NotFoundException);
    });
  });
});