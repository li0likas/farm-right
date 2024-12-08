import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { TaskTypeOptionsService } from './taskTypeOptions.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('task-type-options')
export class TaskTypeOptionsController {
  constructor(private readonly taskTypeOptionService: TaskTypeOptionsService) {}
  @Get()
  @ApiOperation({ summary: 'Get all task type options' })
  @ApiResponse({ status: 200, description: 'All task type options retrieved successfully.' })
  async taskTypeOptions() {
      return await this.taskTypeOptionService.getAllTaskTypeOptions();
  }
}





