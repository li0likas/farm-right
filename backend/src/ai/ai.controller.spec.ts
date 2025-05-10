import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

describe('AiController', () => {
  let controller: AiController;

  const mockAiService = {
    getOptimalDateInsights: jest.fn(),
    refineTaskDescription: jest.fn(),
    generateCurrentFarmInsight: jest.fn(),
    generateTaskDescription: jest.fn(),
  };

  const mockPrismaService = {
    farmMember: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: mockAiService },
        { provide: PrismaService, useValue: mockPrismaService },
        Reflector,
        PermissionsGuard,
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  describe('getOptimalDateInsights', () => {
    it('should return insights from AI service', async () => {
      const body = {
        weatherData: {},
        dueDate: '2025-05-10',
        taskType: 1,
        optimalDateTime: '2025-05-11T10:00:00Z',
      };

      const mockInsights = ['Insight A', 'Insight B'];
      mockAiService.getOptimalDateInsights.mockResolvedValue(mockInsights);

      const result = await controller.getOptimalDateInsights(body);
      expect(result).toEqual({ insights: mockInsights });
      expect(mockAiService.getOptimalDateInsights).toHaveBeenCalledWith(
        body.weatherData,
        body.dueDate,
        body.taskType,
        body.optimalDateTime,
      );
    });
  });

  describe('refineTaskDescription', () => {
    it('should return refined task description', async () => {
      const rawText = 'Raw task text';
      const mockRefined = 'Refined task description';
      mockAiService.refineTaskDescription.mockResolvedValue(mockRefined);

      const result = await controller.refineTaskDescription({ rawText });
      expect(result).toEqual({ refinedTaskDescription: mockRefined });
      expect(mockAiService.refineTaskDescription).toHaveBeenCalledWith(rawText);
    });
  });

  describe('generateFarmSummary', () => {
    it('should return farm summary from AI service', async () => {
      const req = { headers: { 'x-selected-farm-id': '42' } };
      const mockInsight = 'Farm Insight Summary';
      mockAiService.generateCurrentFarmInsight.mockResolvedValue(mockInsight);

      const result = await controller.generateFarmSummary(req as any);
      expect(result).toEqual({ insights: mockInsight });
      expect(mockAiService.generateCurrentFarmInsight).toHaveBeenCalledWith(42);
    });

    it('should throw ForbiddenException for invalid farm ID', async () => {
      const req = { headers: { 'x-selected-farm-id': 'invalid' } };
      await expect(controller.generateFarmSummary(req as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateTaskDescription', () => {
    it('should return refined crop-health task description', async () => {
      const rawText = 'Crop issue description';
      const refined = 'Suggested task for crop health';
      mockAiService.generateTaskDescription.mockResolvedValue(refined);

      const result = await controller.generateTaskDescription({ rawText });
      expect(result).toEqual({ refinedTaskDescription: refined });
      expect(mockAiService.generateTaskDescription).toHaveBeenCalledWith(rawText);
    });
  });
});
