import { Injectable } from '@nestjs/common';

@Injectable()
export class AiServiceMock {
  async getOptimalDateInsights(weatherData: any, dueDate: string, taskType: number, optimalDateTime: string): Promise<string> {
    return 'Mock AI insights for optimal date.';
  }

  async generateCurrentFarmInsight(farmId: number): Promise<string> {
    return 'Mock AI farm insights.';
  }

  async generateTaskDescription(rawText: string): Promise<string> {
    return 'Mock AI task description.';
  }

  async refineTaskDescription(rawText: string): Promise<string> {
    return 'Mock refined task description.';
  }
}