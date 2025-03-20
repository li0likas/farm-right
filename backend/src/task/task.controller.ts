import { Controller, Post, Body, Get, Param, Put, Patch, UseGuards, Request, Delete, NotFoundException, UnprocessableEntityException, ForbiddenException } from '@nestjs/common';
import { TaskService } from './task.service';
import { CommentService } from '../comment/comment.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { Comment } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaskResponseDto } from './dto/task-response.dto';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { EquipmentService } from 'src/equipment/equipment.service';
import { Permissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly commentService: CommentService,
    private readonly equipmentService: EquipmentService,
  ) {}

  @Get('/stats')
  @Permissions('TASK_STATS_READ')
  @ApiOperation({ summary: 'Get completed tasks count and total tasks count' })
  @ApiResponse({ status: 200, description: 'Completed tasks count retrieved successfully.' })
  async getCompletedTasks(@Request() req): Promise<{ completedTasks: number; totalTasks: number }> {
      const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
      if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

      return this.taskService.getCompletedTasks(farmId);
  }

  @Post()
  @Permissions('TASK_CREATE')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'The task has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Request() req, @Body() createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.taskService.create(createTaskDto, farmId);
  }

  @Get()
  @Permissions('TASK_READ')
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'All tasks retrieved successfully.' })
  async findAll(@Request() req): Promise<TaskResponseDto[]> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.taskService.findAll(farmId);
  }

  @Get(':id')
  @Permissions('TASK_READ')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiResponse({ status: 200, description: 'The task has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async findOne(@Request() req, @Param('id') id: string): Promise<TaskResponseDto> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.taskService.findOne(parseInt(id), farmId);
  }

  @Put(':id')
  @Permissions('TASK_UPDATE')
  @ApiOperation({ summary: 'Update a task by id' })
  @ApiResponse({ status: 200, description: 'The task has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async update(@Request() req, @Param('id') id: string, @Body() updateTaskDto: Partial<CreateTaskDto>): Promise<TaskResponseDto> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.taskService.update(parseInt(id), updateTaskDto, farmId);
  }

  @Patch(':id')
  @Permissions('TASK_CHANGE_STATUS')
  @ApiOperation({ summary: 'Patch a task by id' })
  @ApiResponse({ status: 200, description: 'The task has been successfully patched.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async changeTaskStatus(@Request() req, @Param('id') id: string, @Body('statusId') statusId: number) {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.taskService.changeTaskStatus(parseInt(id), statusId, farmId);
  }

  @Delete(':id')
  @Permissions('TASK_DELETE')
  @ApiOperation({ summary: 'Delete a task by id' })
  @ApiResponse({ status: 204, description: 'The task has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 422, description: 'Unprocessable Entity. Task has dependencies.' })
  async delete(@Request() req, @Param('id') id: string): Promise<TaskResponseDto> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');
    
    try {
      return this.taskService.delete(parseInt(id), farmId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new UnprocessableEntityException('Task cannot be deleted as it has dependent records (e.g., comments).');
      }
      throw error;
    }
  }

  @Get(':id/comments')
  @Permissions('FIELD_TASK_COMMENT_READ')
  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async findAllComments(@Request() req, @Param('id') taskId: string): Promise<Comment[]> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.commentService.findAll(parseInt(taskId), farmId);
  }

  @Post(':id/comments')
  @Permissions('FIELD_TASK_COMMENT_CREATE')
  @ApiOperation({ summary: 'Create a new comment for a task' })
  @ApiResponse({ status: 201, description: 'Comment successfully created.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async createComment(@Request() req, @Param('id') taskId: string, @Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    createCommentDto.taskId = parseInt(taskId);
    return this.commentService.create(createCommentDto, farmId);
  }

  @Delete(':id/comments/:commentId')
  @Permissions('FIELD_TASK_COMMENT_DELETE')
  @ApiOperation({ summary: 'Delete a comment for a task' })
  @ApiResponse({ status: 204, description: 'Comment successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async deleteComment(@Request() req, @Param('id') taskId: string, @Param('commentId') commentId: string): Promise<void> {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    await this.commentService.delete(parseInt(commentId), farmId);
  }
  
  @Get(':id/equipment')
  @Permissions('TASK_EQUIPMENT_READ')
  @ApiOperation({ summary: 'Get all equipment for a task' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async getEquipmentForTask(@Request() req, @Param('id') taskId: string) {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.equipmentService.getEquipmentForTask(parseInt(taskId), farmId);
  }

  @Post(':id/equipment')
  @Permissions('TASK_EQUIPMENT_ASSIGN')
  @ApiOperation({ summary: 'Add equipment to a task' })
  @ApiResponse({ status: 201, description: 'Equipment added to task successfully.' })
  @ApiResponse({ status: 404, description: 'Task or equipment not found.' })
  async addEquipmentToTask(@Request() req, @Param('id') taskId: string, @Body('equipmentId') equipmentId: number) {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');    

    return this.equipmentService.addEquipmentToTask(parseInt(taskId), equipmentId, farmId);
  }

  @Delete(':id/equipment/:equipmentId')
  @Permissions('TASK_EQUIPMENT_REMOVE')
  @ApiOperation({ summary: 'Remove equipment from a task' })
  @ApiResponse({ status: 204, description: 'Equipment removed from task successfully.' })
  @ApiResponse({ status: 404, description: 'Task or equipment not found.' })
  async removeEquipmentFromTask(@Request() req, @Param('id') taskId: string, @Param('equipmentId') equipmentId: number) {
    const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

    return this.equipmentService.removeEquipmentFromTask(parseInt(taskId), equipmentId, farmId);
  }
}