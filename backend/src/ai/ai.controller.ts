import { Controller, Post, Body, UseInterceptors, UploadedFile, ForbiddenException, Request, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { AuthGuard } from '@nestjs/passport';
//import { FileInterceptor } from '@nestjs/platform-express';
// import { Express } from 'express';
// import type { Multer } from 'multer'; // ✅ Correct import for Multer types
// import * as path from 'path';
// import { diskStorage } from 'multer';


@Controller('ai')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
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

  @Post('task-description')
  async refineTaskDescription(@Body() body: { rawText: string }) {
    const refinedTaskDescription = await this.aiService.refineTaskDescription(body.rawText);
    return { refinedTaskDescription };
  }

  @Post('farm-summary')
  @Permissions('DASHBOARD_AI_SUMMARY')
  async generateFarmSummary(@Request() req) {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException("Invalid farm selection.");
  
    const insight = await this.aiService.generateCurrentFarmInsight(farmId);
    return { insights: insight };
  }

  @Post('crop-health-task-description')
  async generateTaskDescription(@Body() body: { rawText: string }) {
    const { rawText } = body;
    const result = await this.aiService.generateTaskDescription(rawText);
    return { refinedTaskDescription: result };
  }

  // @Post('generate-description-from-audio')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (req, file, cb) => {
  //         const filename = `${Date.now()}-${file.originalname}`;
  //         cb(null, filename);
  //       },
  //     }),
  //   }),
  // )
  // async generateDescriptionFromAudio(@UploadedFile() file: Express.Multer.File) {
  //   if (!file) {
  //     console.error('No file uploaded');
  //   }

  //   return this.aiService.processAudio(file);
  // }
}