
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { EquipmentService } from '../../src/equipment/equipment.service';
import { ConflictException } from '@nestjs/common';

const mockPrismaEquipmentService = {
  equipment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
  },
  taskEquipment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('EquipmentService', () => {
  let equipmentService: EquipmentService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: mockPrismaEquipmentService },
      ],
    }).compile();

    equipmentService = module.get<EquipmentService>(EquipmentService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getAllEquipment', () => {
    it('should return all equipment for a farm', async () => {
      // Arrange
      const farmId = 1;
      const mockEquipment = [
        { id: 1, name: 'Equipment 1' },
        { id: 2, name: 'Equipment 2' },
      ];

      mockPrismaEquipmentService.equipment.findMany.mockResolvedValue(mockEquipment);

      // Act
      const result = await equipmentService.getAllEquipment(farmId);

      // Assert
      expect(mockPrismaEquipmentService.equipment.findMany).toHaveBeenCalledWith({
        where: { farmId },
      });
      expect(result).toEqual(mockEquipment);
    });
  });

  describe('getEquipmentById', () => {
    it('should return equipment by id', async () => {
      // Arrange
      const equipmentId = 1;
      const farmId = 1;
      const mockEquipment = { id: equipmentId, name: 'Test Equipment' };

      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(mockEquipment);

      // Act
      const result = await equipmentService.getEquipmentById(equipmentId, farmId);

      // Assert
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(result).toEqual(mockEquipment);
    });

    it('should throw NotFoundException when equipment not found', async () => {
      // Arrange
      const equipmentId = 1;
      const farmId = 1;

      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(equipmentService.getEquipmentById(equipmentId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
    });
  });

  describe('createEquipment', () => {
    it('should create equipment', async () => {
      // Arrange
      const createEquipmentDto = {
        name: 'New Equipment',
        typeId: 1,
        ownerId: 1,
        farmId: 1,
        description: 'Test description',
      };
      const mockCreatedEquipment = { id: 1, ...createEquipmentDto };

      mockPrismaEquipmentService.equipment.create.mockResolvedValue(mockCreatedEquipment);

      // Act
      const result = await equipmentService.createEquipment(createEquipmentDto);

      // Assert
      expect(mockPrismaEquipmentService.equipment.create).toHaveBeenCalledWith({
        data: createEquipmentDto,
      });
      expect(result).toEqual(mockCreatedEquipment);
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment', async () => {
      // Arrange
      const equipmentId = 1;
      const farmId = 1;
      const updateData = { name: 'Updated Equipment' };
      const mockEquipment = { id: equipmentId, name: 'Test Equipment' };
      const mockUpdatedEquipment = { id: equipmentId, name: 'Updated Equipment' };

      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrismaEquipmentService.equipment.update.mockResolvedValue(mockUpdatedEquipment);

      // Act
      const result = await equipmentService.updateEquipment(equipmentId, updateData, farmId);

      // Assert
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(mockPrismaEquipmentService.equipment.update).toHaveBeenCalledWith({
        where: { id: equipmentId },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedEquipment);
    });

    it('should throw NotFoundException when equipment not found', async () => {
      // Arrange
      const equipmentId = 1;
      const farmId = 1;
      const updateData = { name: 'Updated Equipment' };

      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(equipmentService.updateEquipment(equipmentId, updateData, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(mockPrismaEquipmentService.equipment.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment', async () => {
      // Arrange
      const equipmentId = 1;
      const farmId = 1;
      const mockEquipment = { id: equipmentId, name: 'Test Equipment' };

      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrismaEquipmentService.equipment.delete.mockResolvedValue(mockEquipment);

      // Act
      const result = await equipmentService.deleteEquipment(equipmentId, farmId);

      // Assert
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(mockPrismaEquipmentService.equipment.delete).toHaveBeenCalledWith({
        where: { id: equipmentId },
      });
      expect(result).toEqual(mockEquipment);
    });

    it('should throw NotFoundException when equipment not found', async () => {
      // Arrange
      const equipmentId = 1;
      const farmId = 1;

      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(equipmentService.deleteEquipment(equipmentId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(mockPrismaEquipmentService.equipment.delete).not.toHaveBeenCalled();
    });
  });

  describe('addEquipmentToTask', () => {
    it('should add equipment to task', async () => {
      // Arrange
      const taskId = 1;
      const equipmentId = 1;
      const farmId = 1;
      const mockTask = { id: taskId };
      const mockEquipment = { id: equipmentId, farmId };
      const mockTaskEquipment = { id: 1, taskId, equipmentId };

      mockPrismaEquipmentService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrismaEquipmentService.taskEquipment.findFirst.mockResolvedValue(null);
      mockPrismaEquipmentService.taskEquipment.create.mockResolvedValue(mockTaskEquipment);

      // Act
      const result = await equipmentService.addEquipmentToTask(taskId, equipmentId, farmId);

      // Assert
      expect(mockPrismaEquipmentService.task.findUnique).toHaveBeenCalledWith({ 
        where: { id: taskId } 
      });
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(mockPrismaEquipmentService.taskEquipment.findFirst).toHaveBeenCalledWith({
        where: { taskId, equipmentId },
      });
      expect(mockPrismaEquipmentService.taskEquipment.create).toHaveBeenCalledWith({
        data: {
          taskId,
          equipmentId,
        },
      });
      expect(result).toEqual(mockTaskEquipment);
    });

    it('should throw NotFoundException when task not found', async () => {
      // Arrange
      const taskId = 1;
      const equipmentId = 1;
      const farmId = 1;

      mockPrismaEquipmentService.task.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(equipmentService.addEquipmentToTask(taskId, equipmentId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaEquipmentService.task.findUnique).toHaveBeenCalledWith({ 
        where: { id: taskId } 
      });
      expect(mockPrismaEquipmentService.equipment.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when equipment not found', async () => {
      // Arrange
      const taskId = 1;
      const equipmentId = 1;
      const farmId = 1;
      const mockTask = { id: taskId };

      mockPrismaEquipmentService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(equipmentService.addEquipmentToTask(taskId, equipmentId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaEquipmentService.task.findUnique).toHaveBeenCalledWith({ 
        where: { id: taskId } 
      });
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(mockPrismaEquipmentService.taskEquipment.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when equipment already assigned to task', async () => {
      // Arrange
      const taskId = 1;
      const equipmentId = 1;
      const farmId = 1;
      const mockTask = { id: taskId };
      const mockEquipment = { id: equipmentId, farmId };
      const mockExistingAssignment = { id: 1, taskId, equipmentId };

      mockPrismaEquipmentService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaEquipmentService.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockPrismaEquipmentService.taskEquipment.findFirst.mockResolvedValue(mockExistingAssignment);

      // Act & Assert
      await expect(equipmentService.addEquipmentToTask(taskId, equipmentId, farmId)).rejects.toThrow(ConflictException);
      expect(mockPrismaEquipmentService.task.findUnique).toHaveBeenCalledWith({ 
        where: { id: taskId } 
      });
      expect(mockPrismaEquipmentService.equipment.findFirst).toHaveBeenCalledWith({
        where: { id: equipmentId, farmId },
      });
      expect(mockPrismaEquipmentService.taskEquipment.findFirst).toHaveBeenCalledWith({
        where: { taskId, equipmentId },
      });
      expect(mockPrismaEquipmentService.taskEquipment.create).not.toHaveBeenCalled();
    });
  });

  describe('removeEquipmentFromTask', () => {
    it('should remove equipment from task', async () => {
      // Arrange
      const taskId = 1;
      const equipmentId = 1;
      const farmId = 1;
      const mockTaskEquipment = { 
        id: 1, 
        taskId, 
        equipmentId,
        equipment: { farmId } 
      };

      mockPrismaEquipmentService.taskEquipment.findFirst.mockResolvedValue(mockTaskEquipment);
      mockPrismaEquipmentService.taskEquipment.delete.mockResolvedValue(mockTaskEquipment);

      // Act
      const result = await equipmentService.removeEquipmentFromTask(taskId, equipmentId, farmId);

      // Assert
      expect(mockPrismaEquipmentService.taskEquipment.findFirst).toHaveBeenCalledWith({
        where: { taskId, equipmentId },
        include: { equipment: true },
      });
      expect(mockPrismaEquipmentService.taskEquipment.delete).toHaveBeenCalledWith({
        where: { id: mockTaskEquipment.id },
      });
      expect(result).toEqual(mockTaskEquipment);
    });

    it('should throw NotFoundException when equipment not assigned to task', async () => {
      // Arrange
      const taskId = 1;
      const equipmentId = 1;
      const farmId = 1;

      mockPrismaEquipmentService.taskEquipment.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(equipmentService.removeEquipmentFromTask(taskId, equipmentId, farmId))
        .rejects.toThrow(NotFoundException);
      expect(mockPrismaEquipmentService.taskEquipment.findFirst).toHaveBeenCalledWith({
        where: { taskId, equipmentId },
        include: { equipment: true },
      });
      expect(mockPrismaEquipmentService.taskEquipment.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when equipment belongs to different farm', async () => {
      // Arrange
      const taskId = 1;
      const equipmentId = 1;
      const farmId = 1;
      const differentFarmId = 2;
      const mockTaskEquipment = { 
        id: 1, 
        taskId, 
        equipmentId,
        equipment: { farmId: differentFarmId } 
      };

      mockPrismaEquipmentService.taskEquipment.findFirst.mockResolvedValue(mockTaskEquipment);

      // Act & Assert
      await expect(equipmentService.removeEquipmentFromTask(taskId, equipmentId, farmId))
        .rejects.toThrow(NotFoundException);
      expect(mockPrismaEquipmentService.taskEquipment.findFirst).toHaveBeenCalledWith({
        where: { taskId, equipmentId },
        include: { equipment: true },
      });
      expect(mockPrismaEquipmentService.taskEquipment.delete).not.toHaveBeenCalled();
    });
  });
});