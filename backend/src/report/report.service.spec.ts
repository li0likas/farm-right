import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from '../../src/report/report.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ReportService', () => {
  let service: ReportService;
  let prismaService: PrismaService;

  // Mock data
  const mockFields = [
    { id: 1, name: 'Field 1' },
    { id: 2, name: 'Field 2' },
  ];

  const mockTasks = [
    {
      id: 1,
      fieldId: 1,
      field: { name: 'Field 1', area: 10 },
      type: { name: 'Planting' },
      status: { name: 'Completed' },
      createdAt: new Date('2023-01-01'),
      completionDate: new Date('2023-01-05'),
    },
    {
      id: 2,
      fieldId: 1,
      field: { name: 'Field 1', area: 10 },
      type: { name: 'Harvesting' },
      status: { name: 'Pending' },
      createdAt: new Date('2023-01-10'),
      completionDate: null,
    },
    {
      id: 3,
      fieldId: 2,
      field: { name: 'Field 2', area: 5 },
      type: { name: 'Planting' },
      status: { name: 'Canceled' },
      createdAt: new Date('2023-01-15'),
      completionDate: null,
    },
  ];

  const mockEquipments = [
    {
      id: 1,
      name: 'Tractor',
      type: { name: 'Tractor' },
      tasks: [
        {
          task: {
            id: 1,
            seasonId: 1,
            status: { name: 'Completed' },
            type: { name: 'Planting' },
            field: { area: 10 },
          },
          fuelUsed: 10,
          minutesUsed: 60,
        },
      ],
    },
    {
      id: 2,
      name: 'Sprayer',
      type: { name: 'Sprayer' },
      tasks: [
        {
          task: {
            id: 2,
            seasonId: 1,
            status: { name: 'Completed' },
            type: { name: 'Spraying' },
            field: { area: 5 },
          },
          fuelUsed: 5,
          minutesUsed: 30,
        },
        {
          task: {
            id: 3,
            seasonId: 2, // Different season
            status: { name: 'Completed' },
            type: { name: 'Spraying' },
            field: { area: 8 },
          },
          fuelUsed: 8,
          minutesUsed: 45,
        },
      ],
    },
  ];

  const mockTaskParticipants = [
    {
      farmMember: {
        id: 1,
        user: { id: 1, username: 'user1' },
        role: { name: 'Worker' },
      },
      task: {
        id: 1,
        seasonId: 1,
        status: { name: 'Completed' },
        field: { farmId: 1 },
        description: 'Task 1',
      },
      minutesWorked: 60,
    },
    {
      farmMember: {
        id: 1,
        user: { id: 1, username: 'user1' },
        role: { name: 'Worker' },
      },
      task: {
        id: 2,
        seasonId: 1,
        status: { name: 'Completed' },
        field: { farmId: 1 },
        description: 'Task 2',
      },
      minutesWorked: 45,
    },
    {
      farmMember: {
        id: 2,
        user: { id: 2, username: 'user2' },
        role: { name: 'Manager' },
      },
      task: {
        id: 1,
        seasonId: 1,
        status: { name: 'Completed' },
        field: { farmId: 1 },
        description: 'Task 1',
      },
      minutesWorked: 30,
    },
  ];

  // Mock prisma service
  const mockPrismaService = {
    field: {
      findMany: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    equipment: {
      findMany: jest.fn(),
    },
    taskParticipant: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });
});

  describe('getTaskReport', () => {
    const farmId = 1;
    const seasonId = 1;

    beforeEach(() => {
      mockPrismaService.field.findMany.mockResolvedValue(mockFields);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
    });

    it('should return task report data for the specified farm and season', async () => {
      const result = await service.getTaskReport(farmId, seasonId);

      expect(mockPrismaService.field.findMany).toHaveBeenCalledWith({
        where: { farmId },
        select: { id: true, name: true },
      });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          field: { farmId },
          seasonId,
        },
        include: {
          status: true,
          field: true,
          type: true,
        },
      });

      expect(result).toEqual({
        totalTasks: 3,
        completedTasks: 1,
        pendingTasks: 1,
        canceledTasks: 1,
        averageCompletionTimeMinutes: expect.any(Number),
        groupedByField: expect.any(Object),
        groupedByType: expect.any(Object),
      });

      // Field grouping validation
      expect(result.groupedByField['Field 1']).toBe(2);
      expect(result.groupedByField['Field 2']).toBe(1);

      // Task type grouping validation
      expect(result.groupedByType['Planting']).toBe(2);
      expect(result.groupedByType['Harvesting']).toBe(1);
    });

    it('should return task report without season filter when seasonId is not provided', async () => {
      const result = await service.getTaskReport(farmId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          field: { farmId },
        },
        include: {
          status: true,
          field: true,
          type: true,
        },
      });

      expect(result).toEqual(expect.objectContaining({
        totalTasks: 3,
        completedTasks: 1,
        pendingTasks: 1,
        canceledTasks: 1,
      }));
    });

    it('should calculate average completion time correctly for completed tasks', async () => {
      // Create tasks with well-defined completion time
      const fixedDateTasks = [
        {
          id: 1,
          status: { name: 'Completed' },
          createdAt: new Date('2023-01-01T10:00:00Z'),
          completionDate: new Date('2023-01-01T12:00:00Z'), // 2 hours = 120 minutes
          field: { name: 'Field 1' },
          type: { name: 'Planting' },
        },
        {
          id: 2,
          status: { name: 'Completed' },
          createdAt: new Date('2023-01-02T10:00:00Z'),
          completionDate: new Date('2023-01-03T10:00:00Z'), // 24 hours = 1440 minutes
          field: { name: 'Field 1' },
          type: { name: 'Harvesting' },
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(fixedDateTasks);

      const result = await service.getTaskReport(farmId, seasonId);

      // Average should be (120 + 1440) / 2 = 780 minutes, but we round it
      expect(result.averageCompletionTimeMinutes).toBe(780);
    });

    it('should handle empty task list', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getTaskReport(farmId, seasonId);

      expect(result).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        canceledTasks: 0,
        averageCompletionTimeMinutes: 0,
        groupedByField: {},
        groupedByType: {},
      });
    });
  });

  describe('getEquipmentUsageReport', () => {
    const farmId = 1;
    const seasonId = 1;

    beforeEach(() => {
      mockPrismaService.equipment.findMany.mockResolvedValue(mockEquipments);
    });

    it('should return equipment usage report for the specified farm and season', async () => {
      const result = await service.getEquipmentUsageReport(farmId, seasonId);

      expect(mockPrismaService.equipment.findMany).toHaveBeenCalledWith({
        where: { farmId },
        include: {
          tasks: {
            include: {
              task: {
                include: {
                  type: true,
                  status: true,
                  field: true,
                },
              },
            },
          },
          type: true,
        },
      });

      expect(result).toHaveLength(2);
      
      // First equipment (Tractor)
      expect(result[0]).toEqual({
        id: 1,
        name: 'Tractor',
        totalTasks: 1,
        totalFuel: 10,
        totalMinutes: 60,
        totalArea: 10,
        byTaskType: {
          'Planting': {
            count: 1,
            fuel: 10,
            minutes: 60,
            area: 10,
          },
        },
      });

      // Second equipment (Sprayer) - should only include tasks from the specified season
      expect(result[1]).toEqual({
        id: 2,
        name: 'Sprayer',
        totalTasks: 1,
        totalFuel: 5,
        totalMinutes: 30,
        totalArea: 5,
        byTaskType: {
          'Spraying': {
            count: 1,
            fuel: 5,
            minutes: 30,
            area: 5,
          },
        },
      });
    });

    it('should filter tasks by the specified season', async () => {
      // Change to season 2
      const seasonId2 = 2;
      const result = await service.getEquipmentUsageReport(farmId, seasonId2);

      // Should only include the task from season 2 for the second equipment
      expect(result[1]).toEqual({
        id: 2,
        name: 'Sprayer',
        totalTasks: 1,
        totalFuel: 8,
        totalMinutes: 45,
        totalArea: 8,
        byTaskType: {
          'Spraying': {
            count: 1,
            fuel: 8,
            minutes: 45,
            area: 8,
          },
        },
      });
    });

    it('should handle equipment with no tasks in the specified season', async () => {
      const mockEmptyEquipment = [
        {
          id: 3,
          name: 'Empty Equipment',
          type: { name: 'Other' },
          tasks: [],
        }
      ];

      mockPrismaService.equipment.findMany.mockResolvedValue(mockEmptyEquipment);

      const result = await service.getEquipmentUsageReport(farmId, seasonId);

      expect(result[0]).toEqual({
        id: 3,
        name: 'Empty Equipment',
        totalTasks: 0,
        totalFuel: 0,
        totalMinutes: 0,
        totalArea: 0,
        byTaskType: {},
      });
    });
  });

  describe('getFarmMemberActivityReport', () => {
    const farmId = 1;
    const seasonId = 1;

    beforeEach(() => {
      mockPrismaService.taskParticipant.findMany.mockResolvedValue(mockTaskParticipants);
    });

    it('should return farm member activity report for the specified farm and season', async () => {
      const result = await service.getFarmMemberActivityReport(farmId, seasonId);

      expect(mockPrismaService.taskParticipant.findMany).toHaveBeenCalledWith({
        where: {
          task: {
            seasonId,
            field: {
              farmId,
            },
            status: {
              name: 'Completed',
            },
          },
        },
        include: {
          farmMember: {
            include: {
              user: true,
              role: true,
            },
          },
          task: true,
        },
      });

      expect(result).toHaveLength(2);
      
      // First member (user1) - participated in 2 tasks
      expect(result[0]).toEqual({
        id: 1,
        username: 'user1',
        role: 'Worker',
        taskCount: 2,
        totalMinutes: 105, // 60 + 45
        taskTitles: ['Task 1', 'Task 2'],
      });

      // Second member (user2) - participated in 1 task
      expect(result[1]).toEqual({
        id: 2,
        username: 'user2',
        role: 'Manager',
        taskCount: 1,
        totalMinutes: 30,
        taskTitles: ['Task 1'],
      });
    });

    it('should handle case with no task participants', async () => {
      mockPrismaService.taskParticipant.findMany.mockResolvedValue([]);

      const result = await service.getFarmMemberActivityReport(farmId, seasonId);

      expect(result).toEqual([]);
    });

    it('should handle case with null minutesWorked', async () => {
      const tasksWithNullMinutes = [
        {
          farmMember: {
            id: 1,
            user: { id: 1, username: 'user1' },
            role: { name: 'Worker' },
          },
          task: {
            id: 1,
            seasonId: 1,
            status: { name: 'Completed' },
            field: { farmId: 1 },
            description: 'Task with null minutes',
          },
          minutesWorked: null,
        },
      ];

      mockPrismaService.taskParticipant.findMany.mockResolvedValue(tasksWithNullMinutes);

      const result = await service.getFarmMemberActivityReport(farmId, seasonId);

      expect(result[0].totalMinutes).toBe(0);
    });
  });