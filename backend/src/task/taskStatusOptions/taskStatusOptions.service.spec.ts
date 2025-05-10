import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatusOptionsService } from './taskStatusOptions.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TaskStatusOptionsService', () => {
  let service: TaskStatusOptionsService;
  let prismaService: PrismaService;

  const mockTaskStatusOptions = [
    { id: 1, name: 'To Do' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Done' },
  ];

  const prismaServiceMock = {
    taskStatusOptions: {
      findMany: jest.fn().mockResolvedValue(mockTaskStatusOptions),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskStatusOptionsService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<TaskStatusOptionsService>(TaskStatusOptionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all task status options', async () => {
    const result = await service.getAllTaskStatusOptions();
    expect(prismaService.taskStatusOptions.findMany).toHaveBeenCalled();
    expect(result).toEqual(mockTaskStatusOptions);
  });
});
