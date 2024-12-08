import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { TaskStatusOptionsService } from './taskStatusOptions.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('task-status-options')
export class TaskStatusOptionsController {
  constructor(private readonly taskStatusOptionsService: TaskStatusOptionsService) {}
  @Get()
  @ApiOperation({ summary: 'Get all task type options' })
  @ApiResponse({ status: 200, description: 'All task type options retrieved successfully.' })
  async taskStatusOptions() {
      return await this.taskStatusOptionsService.getAllTaskStatusOptions();
  }
}





