import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: EquipmentService;

  const mockEquipmentService = {
    getAllEquipment: jest.fn(),
    getEquipmentById: jest.fn(),
    createEquipment: jest.fn(),
    updateEquipment: jest.fn(),
    deleteEquipment: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn().mockReturnValue(['EQUIPMENT_READ']),
  };

  const mockPrismaService = {
    farmMember: {
      findUnique: jest.fn().mockResolvedValue({
        role: {
          farmPermissions: [{ permission: { name: 'EQUIPMENT_READ' } }],
        },
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        { provide: EquipmentService, useValue: mockEquipmentService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get<EquipmentService>(EquipmentService);
    jest.clearAllMocks();
  });

  describe('getAllEquipment', () => {
    it('should return all equipment for a valid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };
      mockEquipmentService.getAllEquipment.mockResolvedValue(['mockEquipment']);

      const result = await controller.getAllEquipment(req);
      expect(service.getAllEquipment).toHaveBeenCalledWith(1);
      expect(result).toEqual(['mockEquipment']);
    });

    it('should throw error if farm ID is invalid', async () => {
      const req = { headers: { 'x-selected-farm-id': 'invalid' } };
      await expect(controller.getAllEquipment(req)).rejects.toThrow(
        new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getEquipmentById', () => {
    it('should return equipment by ID and farm', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };
      mockEquipmentService.getEquipmentById.mockResolvedValue('mockEquipment');

      const result = await controller.getEquipmentById(5, req);
      expect(service.getEquipmentById).toHaveBeenCalledWith(5, 1);
      expect(result).toBe('mockEquipment');
    });

    it('should throw error if farm ID is invalid', async () => {
      const req = { headers: { 'x-selected-farm-id': 'invalid' } };
      await expect(controller.getEquipmentById(5, req)).rejects.toThrow(
        new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('createEquipment', () => {
    it('should create equipment with correct data', async () => {
      const req = {
        headers: { 'x-selected-farm-id': '1' },
        user: { id: '2' },
        body: { name: 'Tractor', description: 'Large', typeId: 3 },
      };
      const expectedDto: CreateEquipmentDto = {
        name: 'Tractor',
        description: 'Large',
        typeId: 3,
        ownerId: 2,
        farmId: 1,
      };

      mockEquipmentService.createEquipment.mockResolvedValue('createdEquipment');

      const result = await controller.createEquipment(req);
      expect(service.createEquipment).toHaveBeenCalledWith(expectedDto);
      expect(result).toBe('createdEquipment');
    });

    it('should throw error if farm ID is invalid', async () => {
      const req = {
        headers: { 'x-selected-farm-id': 'invalid' },
        user: { id: '2' },
        body: { name: 'Tractor', description: 'Large', typeId: 3 },
      };

      await expect(controller.createEquipment(req)).rejects.toThrow(
        new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('updateEquipment', () => {
    it('should update equipment with correct ID and data', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };
      const data = { name: 'Updated Name' };

      mockEquipmentService.updateEquipment.mockResolvedValue('updated');

      const result = await controller.updateEquipment('5', data, req);
      expect(service.updateEquipment).toHaveBeenCalledWith(5, data, 1);
      expect(result).toBe('updated');
    });

    it('should throw error if farm ID is invalid', async () => {
      const req = { headers: { 'x-selected-farm-id': 'invalid' } };
      await expect(controller.updateEquipment('5', {}, req)).rejects.toThrow(
        new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('deleteEquipment', () => {
    it('should delete equipment by ID and farm', async () => {
      const req = { headers: { 'x-selected-farm-id': '1' } };

      mockEquipmentService.deleteEquipment.mockResolvedValue('deleted');

      const result = await controller.deleteEquipment('5', req);
      expect(service.deleteEquipment).toHaveBeenCalledWith(5, 1);
      expect(result).toBe('deleted');
    });

    it('should throw error if farm ID is invalid', async () => {
      const req = { headers: { 'x-selected-farm-id': 'invalid' } };
      await expect(controller.deleteEquipment('5', req)).rejects.toThrow(
        new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
