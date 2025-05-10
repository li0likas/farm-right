import { Test, TestingModule } from '@nestjs/testing';
import { TaskTypeOptionsService } from './taskTypeOptions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TaskTypeOptionsService', () => {
  let service: TaskTypeOptionsService;
  let prisma: PrismaService;

  const mockTaskTypes = [
    { id: 1, name: 'Bug' },
    { id: 2, name: 'Feature' },
  ];

  const prismaMock = {
    taskTypeOptions: {
      findMany: jest.fn().mockResolvedValue(mockTaskTypes),
      findUnique: jest.fn((args) => {
        const found = mockTaskTypes.find((type) => type.id === args.where.id);
        return Promise.resolve(found || null);
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskTypeOptionsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TaskTypeOptionsService>(TaskTypeOptionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTaskTypeOptions', () => {
    it('should return all task type options', async () => {
      const result = await service.getAllTaskTypeOptions();
      expect(prisma.taskTypeOptions.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockTaskTypes);
    });
  });

  describe('getTaskTypeNameById', () => {
    it('should return the task type name for a valid ID', async () => {
      const name = await service.getTaskTypeNameById(1);
      expect(prisma.taskTypeOptions.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(name).toBe('Bug');
    });

    it('should throw NotFoundException if task type is not found', async () => {
      await expect(service.getTaskTypeNameById(999)).rejects.toThrow(
        new NotFoundException('Task type with id 999 not found'),
      );
    });
  });
});
