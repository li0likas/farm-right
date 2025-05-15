import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, NotFoundException, Request, ForbiddenException, BadRequestException, Req, HttpStatus, HttpException } from '@nestjs/common';
import { FieldService } from './field.service';
import { CommentService } from '../comment/comment.service';
import { TaskService } from '../task/task.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { CreateTaskDto } from '../task/dto/create-task.dto';
import { FieldResponseDto } from './dto/field-response.dto';
import { TaskResponseDto } from '../task/dto/task-response.dto';
import { Field, Task } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiTags('fields')
@Controller('fields')
export class FieldController {
  constructor(
    private readonly fieldsService: FieldService,
    private readonly taskService: TaskService,
  ) {}

  @Get('/total-area')
  @Permissions('FIELD_TOTAL_AREA_READ')
  @ApiOperation({ summary: 'Get total field area' })
  @ApiResponse({ status: 200, description: 'Total field area retrieved successfully.' })
  async getTotalFieldArea(@Request() req): Promise<{ totalArea: number }> {
      const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

      if (!selectedFarmId) {
          throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
      }

      const totalArea = await this.fieldsService.getTotalFieldArea(selectedFarmId);
      return { totalArea };
  }

  @Post()
  @Permissions('FIELD_CREATE')
  @ApiOperation({ summary: 'Create a new field' })
  @ApiResponse({ status: 201, description: 'The field has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Request() req): Promise<Field> {
      const ownerId = req.user.id;
      const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

      if (!selectedFarmId) {
          throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
      }

      const { name, area, perimeter, cropId, boundary } = req.body;
      const createFieldDto: CreateFieldDto = { 
          name, area, perimeter, cropId, ownerId, farmId: selectedFarmId, boundary 
      };

      return this.fieldsService.create(createFieldDto);
  }

  @Get()
  @Permissions('FIELD_READ')
  @ApiOperation({ summary: 'Get all fields' })
  @ApiResponse({ status: 200, description: 'The fields have been successfully retrieved.', type: [FieldResponseDto] })
  async findAll(@Request() req): Promise<Field[]> {
    const userId = req.user.id;
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

    if (!selectedFarmId) {
        throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
    }

    return this.fieldsService.findAll(userId, selectedFarmId);
  }

  @Get(':id')
  @Permissions('FIELD_READ')
  @ApiOperation({ summary: 'Get a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Request() req, @Param('id') id: string): Promise<Field> {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

    if (!selectedFarmId) {
        throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
    }

    const field = await this.fieldsService.findOne(parseInt(id), selectedFarmId);
    if (!field) {
        throw new HttpException(`Field with ID ${id} not found in selected farm`, HttpStatus.NOT_FOUND);
    }

    return field;
  }

  @Put(':id')
  @Permissions('FIELD_UPDATE')
  @ApiOperation({ summary: 'Update a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully updated.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(@Request() req, @Param('id') id: string, @Body() fieldData: Partial<Field>): Promise<Field> {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

    if (!selectedFarmId) {
        throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
    }

    const existingField = await this.fieldsService.findOne(parseInt(id), selectedFarmId);
    if (!existingField) {
        throw new HttpException(`Field with ID ${id} not found in selected farm`, HttpStatus.NOT_FOUND);
    }

    return this.fieldsService.update(parseInt(id), fieldData, selectedFarmId);
  }

  @Delete(':id')
  @Permissions('FIELD_DELETE')
  @ApiOperation({ summary: 'Delete a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully deleted.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async delete(@Request() req, @Param('id') id: string): Promise<FieldResponseDto> {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

    if (!selectedFarmId) {
        throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
    }

    const existingField = await this.fieldsService.findOne(parseInt(id), selectedFarmId);
    if (!existingField) {
        throw new HttpException(`Field with ID ${id} not found in selected farm`, HttpStatus.NOT_FOUND);
    }

    return this.fieldsService.delete(parseInt(id), selectedFarmId);
  }

  @Get(':id/tasks')
  @Permissions('FIELD_TASK_READ')
  @ApiOperation({ summary: 'Get all tasks for a field' })
  @ApiResponse({ status: 200, description: 'The tasks have been successfully retrieved.', type: [TaskResponseDto] })
  async findAllTasks(@Request() req, @Param('id') id: string): Promise<Task[]> {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

    if (!selectedFarmId) {
        throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
    }

    const field = await this.fieldsService.findOne(parseInt(id), selectedFarmId);
    if (!field) {
        throw new HttpException(`Field with ID ${id} not found in selected farm`, HttpStatus.NOT_FOUND);
    }

    return this.taskService.findAllTasksForField(parseInt(id), selectedFarmId);
  }

  @Post(':id/tasks')
  @Permissions('FIELD_TASK_CREATE')
  @ApiOperation({ summary: 'Create a new task for a field' })
  @ApiResponse({ status: 201, description: 'The task has been successfully created.', type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async createTask(@Request() req, @Param('id') id: string, @Body() createTaskDto: CreateTaskDto): Promise<Task> {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);

    if (!selectedFarmId) {
        throw new HttpException('Selected farm ID is required', HttpStatus.BAD_REQUEST);
    }

    const field = await this.fieldsService.findOne(parseInt(id), selectedFarmId);
    if (!field) {
        throw new HttpException(`Field with ID ${id} not found in selected farm`, HttpStatus.NOT_FOUND);
    }

    return this.taskService.createTaskForField(parseInt(id), createTaskDto, selectedFarmId);
  }
}