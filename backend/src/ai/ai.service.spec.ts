import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../../src/ai/ai.service';
import { HttpService } from '@nestjs/axios';
import { TaskTypeOptionsService } from '../../src/task/taskTypeOptions/taskTypeOptions.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../src/prisma/prisma.service';
import { of } from 'rxjs';

describe('AiService', () => {
  let service: AiService;
  let httpService: HttpService;
  let taskTypeOptionsService: TaskTypeOptionsService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  // Create mocks
  const mockHttpService = {
    post: jest.fn(() => of({
      data: {
        choices: [
          {
            message: {
              content: 'Mocked AI response content',
            },
          },
        ],
      },
    }))
  };

  const mockTaskTypeOptionsService = {
    getTaskTypeNameById: jest.fn().mockResolvedValue('Spraying'),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      const config = {
        'ai.openaiApiKey': 'mock-api-key',
        'ai.chatGptApiUrl': 'https://api.openai.com/v1/chat/completions',
        'ai.model': 'gpt-4o',
      };
      return config[key];
    })
  };

  const mockPrismaService = {
    task: {
      findMany: jest.fn().mockResolvedValue([{
        id: 1,
        description: 'Task 1',
        type: { name: 'Planting' },
        status: { name: 'Pending' },
        field: { name: 'Field 1' },
        comments: [],
        equipments: [],
      }]),
    },
    field: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: HttpService,
          useValue: mockHttpService
        },
        {
          provide: TaskTypeOptionsService,
          useValue: mockTaskTypeOptionsService
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
        AiService
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    httpService = module.get<HttpService>(HttpService);
    taskTypeOptionsService = module.get<TaskTypeOptionsService>(TaskTypeOptionsService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getOptimalDateInsights', () => {
    it('should generate insights about optimal date for task', async () => {
      // Arrange
      const weatherData = { temp: 20, wind: 5 };
      const dueDate = '2023-05-30';
      const taskType = 4; // Spraying
      const optimalDateTime = '2023-05-25T10:00:00';

      // Act
      const result = await service.getOptimalDateInsights(weatherData, dueDate, taskType, optimalDateTime);

      // Assert
      expect(taskTypeOptionsService.getTaskTypeNameById).toHaveBeenCalledWith(taskType);
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a helpful assistant / agriculture agronomist.' },
            { role: 'user', content: expect.stringContaining('Trumpai paaiškinkite') },
          ],
        },
        {
          headers: {
            'Authorization': 'Bearer mock-api-key',
            'Content-Type': 'application/json',
          },
        }
      );
      
      expect(result).toBe('Mocked AI response content');
    });

    it('should handle errors from OpenAI API', async () => {
      // Arrange
      const weatherData = { temp: 20, wind: 5 };
      const dueDate = '2023-05-30';
      const taskType = 4;
      const optimalDateTime = '2023-05-25T10:00:00';
      
      mockHttpService.post.mockImplementationOnce(() => {
        throw new Error('API error');
      });

      // Act & Assert
      await expect(service.getOptimalDateInsights(weatherData, dueDate, taskType, optimalDateTime))
        .rejects.toThrow('Error fetching insights from OpenAI: API error');
    });
  });

  describe('generateCurrentFarmInsight', () => {
    it('should generate farm insights for pending tasks', async () => {
      // Arrange
      const farmId = 1;

      // Act
      const result = await service.generateCurrentFarmInsight(farmId);

      // Assert
      expect(prismaService.task.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          field: { farmId },
          status: { name: { not: 'Completed' } },
        }),
        include: expect.any(Object),
      });

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: expect.stringContaining('nepabaigtų') }),
          ]),
        }),
        expect.any(Object)
      );

      expect(result).toBe('Mocked AI response content');
    });

    it('should return default message when no tasks are found', async () => {
      // Arrange
      const farmId = 1;
      mockPrismaService.task.findMany.mockResolvedValueOnce([]);

      // Act
      const result = await service.generateCurrentFarmInsight(farmId);

      // Assert
      expect(result).toBe("Šiuo metu nėra neatliktų ar skubių užduočių, kurioms reikėtų skirti dėmesio.");
    });
  });

  describe('generateTaskDescription', () => {
    it('should generate task description based on raw text', async () => {
      // Arrange
      const rawText = 'Field A: Wheat rust detected';

      // Act
      const result = await service.generateTaskDescription(rawText);

      // Assert
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ 
              role: 'user', 
              content: expect.stringContaining(rawText)
            }),
          ]),
        }),
        expect.any(Object)
      );

      expect(result).toBe('Mocked AI response content');
    });

    it('should handle errors when generating task description', async () => {
      // Arrange
      const rawText = 'Field A: Wheat rust detected';
      
      mockHttpService.post.mockImplementationOnce(() => {
        throw new Error('API error');
      });

      // Act & Assert
      await expect(service.generateTaskDescription(rawText))
        .rejects.toThrow('Failed to generate task description with AI.');
    });
  });

  describe('refineTaskDescription', () => {
    it('should refine task description from voice input', async () => {
      // Arrange
      const rawText = 'Umm need to check the wheat field for signs of disease and maybe apply fungicide';

      // Act
      const result = await service.refineTaskDescription(rawText);

      // Assert
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ 
              role: 'user', 
              content: expect.stringContaining(rawText)
            }),
          ]),
        }),
        expect.any(Object)
      );

      expect(result).toBe('Mocked AI response content');
    });

    it('should handle errors when refining task description', async () => {
      // Arrange
      const rawText = 'Test description';
      
      mockHttpService.post.mockImplementationOnce(() => {
        throw new Error('API error');
      });

      // Act & Assert
      await expect(service.refineTaskDescription(rawText))
        .rejects.toThrow('Failed to process description with AI.');
    });
  });
});