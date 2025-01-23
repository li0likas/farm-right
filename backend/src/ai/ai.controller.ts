import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('insights')
  async getOptimalDateInsights(
    @Body() body: { weatherData: any, dueDate: string, taskType: number, optimalDateTime: string }
  ) {
    const { weatherData, dueDate, taskType, optimalDateTime } = body;
    const insights = await this.aiService.getOptimalDateInsights(weatherData, dueDate, taskType, optimalDateTime);
    return { insights };
  }
}