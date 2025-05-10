import { Test, TestingModule } from '@nestjs/testing';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

describe('SeasonController', () => {
  let controller: SeasonController;
  let service: SeasonService;

  const mockSeasonService = {
    findByFarm: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn().mockReturnValue(['SEASON_READ']),
  };

  const mockPrismaService = {
    farmMember: {
      findUnique: jest.fn().mockResolvedValue({
        role: {
          farmPermissions: [{ permission: { name: 'SEASON_READ' } }],
        },
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonController],
      providers: [
        { provide: SeasonService, useValue: mockSeasonService },
        { provide: Reflector, useValue: mockReflector },
        { provide: PrismaService, useValue: mockPrismaService },
        PermissionsGuard,
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true }) // bypass guard during testing
      .compile();

    controller = module.get<SeasonController>(SeasonController);
    service = module.get<SeasonService>(SeasonService);

    jest.clearAllMocks();
  });

  describe('getSeasonsForSelectedFarm', () => {
    it('should return seasons for valid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': '42' } };
      const expectedSeasons = [{ id: 1, name: 'Spring' }];

      mockSeasonService.findByFarm.mockResolvedValue(expectedSeasons);

      const result = await controller.getSeasonsForSelectedFarm(req);
      expect(result).toEqual(expectedSeasons);
      expect(service.findByFarm).toHaveBeenCalledWith(42);
    });

    it('should throw ForbiddenException for invalid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': 'invalid' } };

      await expect(controller.getSeasonsForSelectedFarm(req)).rejects.toThrow(ForbiddenException);
      expect(service.findByFarm).not.toHaveBeenCalled();
    });
  });
});
