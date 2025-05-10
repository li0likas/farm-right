
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { FieldService } from '../../src/field/field.service';
import { CreateFieldDto } from '../../src/field/dto/create-field.dto';

const mockPrismaFieldService = {
  field: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('FieldService', () => {
  let fieldService: FieldService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldService,
        { provide: PrismaService, useValue: mockPrismaFieldService },
      ],
    }).compile();

    fieldService = module.get<FieldService>(FieldService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a field', async () => {
      // Arrange
      const createFieldDto: CreateFieldDto = {
        name: 'Test Field',
        area: 100,
        perimeter: 50,
        cropId: 1,
        ownerId: 1,
        farmId: 1,
        boundary: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] } },
      };
      const expectedField = { id: 1, ...createFieldDto };

      mockPrismaFieldService.field.create.mockResolvedValue(expectedField);

      // Act
      const result = await fieldService.create(createFieldDto);

      // Assert
      expect(mockPrismaFieldService.field.create).toHaveBeenCalledWith({
        data: createFieldDto,
      });
      expect(result).toEqual(expectedField);
    });
  });

  describe('findAll', () => {
    it('should return all fields for a user in a farm', async () => {
      // Arrange
      const userId = 1;
      const farmId = 1;
      const mockFields = [
        { id: 1, name: 'Field 1' },
        { id: 2, name: 'Field 2' },
      ];

      mockPrismaFieldService.field.findMany.mockResolvedValue(mockFields);

      // Act
      const result = await fieldService.findAll(userId, farmId);

      // Assert
      expect(mockPrismaFieldService.field.findMany).toHaveBeenCalledWith({
        where: {
          farmId: farmId,
        },
        include: {
          crop: true,
          farm: true,
        },
      });
      expect(result).toEqual(mockFields);
    });
  });

  describe('findOne', () => {
    it('should find a field by id', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;
      const mockField = { id: fieldId, name: 'Test Field' };

      mockPrismaFieldService.field.findFirst.mockResolvedValue(mockField);

      // Act
      const result = await fieldService.findOne(fieldId, farmId);

      // Assert
      expect(mockPrismaFieldService.field.findFirst).toHaveBeenCalledWith({
        where: { 
          id: fieldId, 
          farmId: farmId,
        },
        include: {
          crop: true,
          farm: true,
        },
      });
      expect(result).toEqual(mockField);
    });

    it('should return null when field not found', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;

      mockPrismaFieldService.field.findFirst.mockResolvedValue(null);

      // Act
      const result = await fieldService.findOne(fieldId, farmId);

      // Assert
      expect(mockPrismaFieldService.field.findFirst).toHaveBeenCalledWith({
        where: { 
          id: fieldId, 
          farmId: farmId,
        },
        include: {
          crop: true,
          farm: true,
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a field', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;
      const updateData = { name: 'Updated Field' };
      const mockUpdatedField = { id: fieldId, name: 'Updated Field' };

      mockPrismaFieldService.field.update.mockResolvedValue(mockUpdatedField);

      // Act
      const result = await fieldService.update(fieldId, updateData, farmId);

      // Assert
      expect(mockPrismaFieldService.field.update).toHaveBeenCalledWith({
        where: { 
          id: fieldId,
          farmId: farmId,
        },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedField);
    });
  });

  describe('delete', () => {
    it('should delete a field and return it', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;
      const mockField = { id: fieldId, name: 'Test Field' };

      mockPrismaFieldService.field.findFirst.mockResolvedValue(mockField);
      mockPrismaFieldService.field.delete.mockResolvedValue(mockField);

      // Act
      const result = await fieldService.delete(fieldId, farmId);

      // Assert
      expect(mockPrismaFieldService.field.findFirst).toHaveBeenCalledWith({ 
        where: { id: fieldId, farmId: farmId },
      });
      expect(mockPrismaFieldService.field.delete).toHaveBeenCalledWith({ 
        where: { id: fieldId } 
      });
      expect(result).toEqual(mockField);
    });

    it('should throw NotFoundException when field not found', async () => {
      // Arrange
      const fieldId = 1;
      const farmId = 1;

      mockPrismaFieldService.field.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(fieldService.delete(fieldId, farmId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaFieldService.field.findFirst).toHaveBeenCalledWith({ 
        where: { id: fieldId, farmId: farmId },
      });
      expect(mockPrismaFieldService.field.delete).not.toHaveBeenCalled();
    });
  });

  describe('getTotalFieldArea', () => {
    it('should calculate total area of all fields in a farm', async () => {
      // Arrange
      const farmId = 1;
      const mockFields = [
        { area: 100 },
        { area: 200 },
        { area: 300 },
      ];

      mockPrismaFieldService.field.findMany.mockResolvedValue(mockFields);

      // Act
      const result = await fieldService.getTotalFieldArea(farmId);

      // Assert
      expect(mockPrismaFieldService.field.findMany).toHaveBeenCalledWith({
        where: { farmId },
        select: { area: true },
      });
      expect(result).toBe(600); // 100 + 200 + 300
    });

    it('should return 0 when no fields found', async () => {
      // Arrange
      const farmId = 1;

      mockPrismaFieldService.field.findMany.mockResolvedValue([]);

      // Act
      const result = await fieldService.getTotalFieldArea(farmId);

      // Assert
      expect(mockPrismaFieldService.field.findMany).toHaveBeenCalledWith({
        where: { farmId },
        select: { area: true },
      });
      expect(result).toBe(0);
    });
  });
});