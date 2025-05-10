import { Test, TestingModule } from '@nestjs/testing';
import { SeasonService } from '../../src/season/season.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('SeasonService', () => {
  let service: SeasonService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    season: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SeasonService>(SeasonService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('findByFarm', () => {
    const farmId = 1;

    it('should return all seasons for a specific farm ordered by startDate desc', async () => {
      const mockSeasons = [
        {
          id: 1,
          name: 'Season 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          farmId: 1,
        },
        {
          id: 2,
          name: 'Season 2023',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
          farmId: 1,
        },
      ];

      mockPrismaService.season.findMany.mockResolvedValue(mockSeasons);

      const result = await service.findByFarm(farmId);

      expect(mockPrismaService.season.findMany).toHaveBeenCalledWith({
        where: { farmId },
        orderBy: { startDate: 'desc' },
      });

      expect(result).toEqual(mockSeasons);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1); // First season should be 2024
      expect(result[1].id).toBe(2); // Second season should be 2023
    });

    it('should return empty array when no seasons exist for the farm', async () => {
      mockPrismaService.season.findMany.mockResolvedValue([]);

      const result = await service.findByFarm(farmId);

      expect(mockPrismaService.season.findMany).toHaveBeenCalledWith({
        where: { farmId },
        orderBy: { startDate: 'desc' },
      });

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database error';
      mockPrismaService.season.findMany.mockRejectedValue(new Error(errorMessage));

      await expect(service.findByFarm(farmId)).rejects.toThrow(Error);
    });

    it('should pass farmId parameter correctly to the database query', async () => {
      const anotherFarmId = 2;
      mockPrismaService.season.findMany.mockResolvedValue([]);

      await service.findByFarm(anotherFarmId);

      expect(mockPrismaService.season.findMany).toHaveBeenCalledWith({
        where: { farmId: anotherFarmId },
        orderBy: { startDate: 'desc' },
      });
    });

    it('should not filter results when no farmId is provided', async () => {
      await service.findByFarm(undefined);

      expect(mockPrismaService.season.findMany).toHaveBeenCalledWith({
        where: { farmId: undefined },
        orderBy: { startDate: 'desc' },
      });
    });
  });
});