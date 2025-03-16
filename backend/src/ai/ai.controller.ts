import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AiService } from './ai.service';
//import { FileInterceptor } from '@nestjs/platform-express';
// import { Express } from 'express';
// import type { Multer } from 'multer'; // ✅ Correct import for Multer types
// import * as path from 'path';
// import { diskStorage } from 'multer';


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

  @Post('task-description')
  async refineTaskDescription(@Body() body: { rawText: string }) {
    const refinedTaskDescription = await this.aiService.refineTaskDescription(body.rawText);
    return { refinedTaskDescription };
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