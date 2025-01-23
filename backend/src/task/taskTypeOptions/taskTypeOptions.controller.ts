import { Controller, Get, Res, NotFoundException, Param } from '@nestjs/common';
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

  @Get(':id')
  @ApiOperation({ summary: 'Get task type name by id' })
  @ApiResponse({ status: 200, description: 'Task type name retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task type not found.' })
  async getTaskTypeNameById(@Param('id') id: string): Promise<string> {
    const taskTypeName = await this.taskTypeOptionService.getTaskTypeNameById(parseInt(id));
    if (!taskTypeName) {
      throw new NotFoundException(`Task type with id ${id} not found`);
    }
    return taskTypeName;
  }
}