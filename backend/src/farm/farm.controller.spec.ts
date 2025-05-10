import { Test, TestingModule } from '@nestjs/testing';
import { FarmController } from './farm.controller';
import { FarmService } from './farm.service';

describe('FarmController', () => {
  let controller: FarmController;
  let service: FarmService;

  const mockFarmService = {
    createFarm: jest.fn(),
    getFarmDetails: jest.fn(),
    renameFarm: jest.fn(),
    deleteFarm: jest.fn(),
    leaveFarm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmController],
      providers: [{ provide: FarmService, useValue: mockFarmService }],
    }).compile();

    controller = module.get<FarmController>(FarmController);
    service = module.get<FarmService>(FarmService);

    jest.clearAllMocks();
  });

  describe('createFarm', () => {
    it('should call service with user and name', async () => {
      const req = { user: { id: 1 } };
      const body = { name: 'New Farm' };

      mockFarmService.createFarm.mockResolvedValue('createdFarm');

      const result = await controller.createFarm(req, body);
      expect(service.createFarm).toHaveBeenCalledWith(req.user, 'New Farm');
      expect(result).toBe('createdFarm');
    });
  });

  describe('getFarmDetails', () => {
    it('should call service with parsed farm ID', async () => {
      mockFarmService.getFarmDetails.mockResolvedValue('farmDetails');

      const result = await controller.getFarmDetails('42');
      expect(service.getFarmDetails).toHaveBeenCalledWith(42);
      expect(result).toBe('farmDetails');
    });
  });

  describe('renameFarm', () => {
    it('should call service with id, new name, and user ID', async () => {
      const req = { user: { id: 1 } };
      const body = { name: 'Updated Farm' };

      mockFarmService.renameFarm.mockResolvedValue('renamed');

      const result = await controller.renameFarm('42', body, req);
      expect(service.renameFarm).toHaveBeenCalledWith(42, 'Updated Farm', 1);
      expect(result).toBe('renamed');
    });
  });

  describe('deleteFarm', () => {
    it('should call service with id and user ID', async () => {
      const req = { user: { id: 1 } };

      mockFarmService.deleteFarm.mockResolvedValue('deleted');

      const result = await controller.deleteFarm('42', req);
      expect(service.deleteFarm).toHaveBeenCalledWith(42, 1);
      expect(result).toBe('deleted');
    });
  });

  describe('leaveFarm', () => {
    it('should call service with user ID and farm ID', async () => {
      const req = { user: { id: 1 } };

      mockFarmService.leaveFarm.mockResolvedValue('left');

      const result = await controller.leaveFarm('55', req);
      expect(service.leaveFarm).toHaveBeenCalledWith(1, 55);
      expect(result).toBe('left');
    });
  });
});
