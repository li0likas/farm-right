import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatusOptionsController } from './taskStatusOptions.controller';
import { TaskStatusOptionsService } from './taskStatusOptions.service';

describe('TaskStatusOptionsController', () => {
  let controller: TaskStatusOptionsController;
  let service: TaskStatusOptionsService;

  const mockTaskStatusOptions = [
    { id: 1, name: 'To Do' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Done' },
  ];

  const mockService = {
    getAllTaskStatusOptions: jest.fn().mockResolvedValue(mockTaskStatusOptions),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskStatusOptionsController],
      providers: [
        {
          provide: TaskStatusOptionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TaskStatusOptionsController>(TaskStatusOptionsController);
    service = module.get<TaskStatusOptionsService>(TaskStatusOptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all task status options', async () => {
    const result = await controller.taskStatusOptions();
    expect(service.getAllTaskStatusOptions).toHaveBeenCalled();
    expect(result).toEqual(mockTaskStatusOptions);
  });
});
