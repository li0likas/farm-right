
import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from '../../src/task/task.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateTaskDto } from '../../src/task/dto/create-task.dto';

// Create a mock for PrismaService
const mockPrismaService = {
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  field: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  equipment: {
    findMany: jest.fn(),
  },
  taskParticipant: {
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  farmMember: {
    findFirst: jest.fn(),
  },
  taskEquipment: {
    update: jest.fn(),
  },
};

describe('TaskService', () => {
  let service: TaskService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      // Arrange
      const farmId = 1;
      const createTaskDto: CreateTaskDto = {
        fieldId: 1,
        typeId: 1,
        description: 'Test Task',
        dueDate: new Date(),
        statusId: 1,
        seasonId: 1,
        equipmentIds: [1, 2],
      };

      const mockField = { id: 1, farmId };
      const mockEquipment = [{ id: 1 }, { id: 2 }];
      const mockCreatedTask = { id: 1, ...createTaskDto };

      mockPrismaService.field.findFirst.mockResolvedValue(mockField);
      mockPrismaService.equipment.findMany.mockResolvedValue(mockEquipment);
      mockPrismaService.task.create.mockResolvedValue(mockCreatedTask);

      // Act
      const result = await service.create(createTaskDto, farmId);

      // Assert
      expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
        where: { id: createTaskDto.fieldId, farmId },
      });
      expect(mockPrismaService.equipment.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: createTaskDto.equipmentIds },
          farmId,
        },
      });
      expect(mockPrismaService.task.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedTask);
    });

    it('should throw NotFoundException when field not found', async () => {
      // Arrange
      const farmId = 1;
      const createTaskDto: CreateTaskDto = {
        fieldId: 1,
        typeId: 1,
        description: 'Test Task',
        dueDate: new Date(),
        statusId: 1,
        seasonId: 1,
        equipmentIds: [1, 2],
      };

      mockPrismaService.field.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createTaskDto, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
        where: { id: createTaskDto.fieldId, farmId },
      });
      expect(mockPrismaService.task.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when equipment validation fails', async () => {
      // Arrange
      const farmId = 1;
      const createTaskDto: CreateTaskDto = {
        fieldId: 1,
        typeId: 1,
        description: 'Test Task',
        dueDate: new Date(),
        statusId: 1,
        seasonId: 1,
        equipmentIds: [1, 2, 3], // Requesting 3 equipment items
      };

      const mockField = { id: 1, farmId };
      const mockEquipment = [{ id: 1 }, { id: 2 }]; // Only 2 are valid

      mockPrismaService.field.findFirst.mockResolvedValue(mockField);
      mockPrismaService.equipment.findMany.mockResolvedValue(mockEquipment);

      // Act & Assert
      await expect(service.create(createTaskDto, farmId)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
        where: { id: createTaskDto.fieldId, farmId },
      });
      expect(mockPrismaService.equipment.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: createTaskDto.equipmentIds },
          farmId,
        },
      });
      expect(mockPrismaService.task.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a farm', async () => {
      // Arrange
      const farmId = 1;
      const mockTasks = [
        { id: 1, description: 'Task 1' },
        { id: 2, description: 'Task 2' },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      // Act
      const result = await service.findAll(farmId);

      // Assert
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          field: { farmId },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('findOne', () => {
    it('should find a task by id', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const mockTask = { id: taskId, description: 'Test Task' };

      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);

      // Act
      const result = await service.findOne(taskId, farmId);

      // Assert
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;

      mockPrismaService.task.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(taskId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, field: { farmId } },
        include: expect.any(Object),
      });
    });
  });

  describe('markAsCompleted', () => {
    it('should mark a task as completed with equipment and participant data', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const minutesWorked = 120;
      const equipmentData = { 1: 25, 2: 30 }; // Equipment IDs mapped to fuel used

      const mockTask = {
        id: taskId,
        participants: [{ farmMemberId: 1 }, { farmMemberId: 2 }],
        equipments: [
          { equipmentId: 1 },
          { equipmentId: 2 },
        ],
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({ ...mockTask, statusId: 1, completionDate: expect.any(Date) });
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

      // Verify each participant was updated
      expect(mockPrismaService.taskParticipant.update).toHaveBeenCalledTimes(2);
      
      // Verify each equipment was updated
      expect(mockPrismaService.taskEquipment.update).toHaveBeenCalledTimes(2);
      
      expect(result).toEqual({ message: 'Task marked as completed' });
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const farmId = 1;
      const minutesWorked = 120;
      const equipmentData = { 1: 25, 2: 30 };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.markAsCompleted(taskId, farmId, minutesWorked, equipmentData))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllTasksForField', () => {
    it('should return all tasks for a field', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;
      const mockField = { id: fieldId, farmId };
      const mockTasks = [
        { id: 1, description: 'Task 1' },
        { id: 2, description: 'Task 2' },
      ];

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
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTasks);
    });

    it('should throw NotFoundException when field not found', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;

      mockPrismaService.field.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAllTasksForField(fieldId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.field.findFirst).toHaveBeenCalledWith({
        where: { id: fieldId, farmId },
      });
      expect(mockPrismaService.task.findMany).not.toHaveBeenCalled();
    });
  });
});