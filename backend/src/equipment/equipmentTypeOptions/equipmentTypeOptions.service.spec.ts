import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentTypeOptionsService } from './equipmentTypeOptions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('EquipmentTypeOptionsService', () => {
  let service: EquipmentTypeOptionsService;
  let prisma: PrismaService;

  const mockData = { id: 1, name: 'Tractor' };

  const prismaMock = {
    equipmentTypeOptions: {
      findMany: jest.fn().mockResolvedValue([mockData]),
      findUnique: jest.fn().mockImplementation(({ where: { id } }) =>
        id === 1 ? Promise.resolve(mockData) : Promise.resolve(null)
      ),
      create: jest.fn().mockImplementation(({ data: { name } }) =>
        Promise.resolve({ id: 2, name })
      ),
      update: jest.fn().mockImplementation(({ where: { id }, data: { name } }) =>
        Promise.resolve({ id, name })
      ),
      delete: jest.fn().mockImplementation(({ where: { id } }) =>
        Promise.resolve({ id, name: 'DeletedItem' })
      ),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentTypeOptionsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<EquipmentTypeOptionsService>(EquipmentTypeOptionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllEquipmentTypeOptions', () => {
    it('should return all equipment type options', async () => {
      const result = await service.getAllEquipmentTypeOptions();
      expect(prisma.equipmentTypeOptions.findMany).toHaveBeenCalled();
      expect(result).toEqual([mockData]);
    });
  });

  describe('getEquipmentTypeOptionById', () => {
    it('should return the equipment type option for a valid ID', async () => {
      const result = await service.getEquipmentTypeOptionById(1);
      expect(result).toEqual(mockData);
    });

    it('should throw NotFoundException for non-existing ID', async () => {
      await expect(service.getEquipmentTypeOptionById(999)).rejects.toThrow(
        new NotFoundException('Equipment type option with id 999 not found')
      );
    });
  });

  describe('createEquipmentTypeOption', () => {
    it('should create a new equipment type option', async () => {
      const result = await service.createEquipmentTypeOption('Seeder');
      expect(prisma.equipmentTypeOptions.create).toHaveBeenCalledWith({
        data: { name: 'Seeder' },
      });
      expect(result).toEqual({ id: 2, name: 'Seeder' });
    });
  });

  describe('updateEquipmentTypeOption', () => {
    it('should update an existing equipment type option', async () => {
      const result = await service.updateEquipmentTypeOption(1, 'Harvester');
      expect(prisma.equipmentTypeOptions.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Harvester' },
      });
      expect(result).toEqual({ id: 1, name: 'Harvester' });
    });
  });

  describe('deleteEquipmentTypeOption', () => {
    it('should delete an equipment type option', async () => {
      const result = await service.deleteEquipmentTypeOption(1);
      expect(prisma.equipmentTypeOptions.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ id: 1, name: 'DeletedItem' });
    });
  });
});
