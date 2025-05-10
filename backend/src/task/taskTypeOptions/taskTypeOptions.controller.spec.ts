import { Test, TestingModule } from '@nestjs/testing';
import { TaskTypeOptionsController } from './taskTypeOptions.controller';
import { TaskTypeOptionsService } from './taskTypeOptions.service';
import { NotFoundException } from '@nestjs/common';

describe('TaskTypeOptionsController', () => {
  let controller: TaskTypeOptionsController;
  let service: TaskTypeOptionsService;

  const mockTaskTypes = [
    { id: 1, name: 'Bug' },
    { id: 2, name: 'Feature' },
  ];

  const mockService = {
    getAllTaskTypeOptions: jest.fn().mockResolvedValue(mockTaskTypes),
    getTaskTypeNameById: jest.fn((id: number) => {
      const type = mockTaskTypes.find((t) => t.id === id);
      return Promise.resolve(type?.name || null);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskTypeOptionsController],
      providers: [
        {
          provide: TaskTypeOptionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TaskTypeOptionsController>(TaskTypeOptionsController);
    service = module.get<TaskTypeOptionsService>(TaskTypeOptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('taskTypeOptions', () => {
    it('should return all task type options', async () => {
      const result = await controller.taskTypeOptions();
      expect(service.getAllTaskTypeOptions).toHaveBeenCalled();
      expect(result).toEqual(mockTaskTypes);
    });
  });

  describe('getTaskTypeNameById', () => {
    it('should return task type name for valid ID', async () => {
      const result = await controller.getTaskTypeNameById('1');
      expect(service.getTaskTypeNameById).toHaveBeenCalledWith(1);
      expect(result).toBe('Bug');
    });

    it('should throw NotFoundException for invalid ID', async () => {
      await expect(controller.getTaskTypeNameById('99')).rejects.toThrow(
        new NotFoundException('Task type with id 99 not found'),
      );
    });
  });
});
