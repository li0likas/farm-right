import { Controller, Post, Body, Get, Param, Put, Patch, UseGuards, Request, Delete, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
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

@UseGuards(AuthGuard('jwt'))
@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly commentService: CommentService,
    private readonly equipmentService: EquipmentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'The task has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'All tasks retrieved successfully.' })
  async findAll(@Request() req): Promise<TaskResponseDto[]> {
    const userId = req.user.id;
    return this.taskService.findAll(parseInt(userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiResponse({ status: 200, description: 'The task has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async findOne(@Param('id') id: string): Promise<TaskResponseDto> {
    return this.taskService.findOne(parseInt(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task by id' })
  @ApiResponse({ status: 200, description: 'The task has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async update(@Param('id') id: string, @Body() updateTaskDto: Partial<CreateTaskDto>): Promise<TaskResponseDto> {
    return this.taskService.update(parseInt(id), updateTaskDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch a task by id' })
  @ApiResponse({ status: 200, description: 'The task has been successfully patched.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async changeTaskStatus(@Param('id') id: string, @Body('statusId') statusId: number) {
    return this.taskService.changeTaskStatus(parseInt(id), statusId);
  }

    // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a task by id' })
  // @ApiResponse({ status: 204, description: 'The task has been successfully deleted.' })
  // @ApiResponse({ status: 404, description: 'Task not found.' })
  // async delete(@Param('id') id: string): Promise<TaskResponseDto> {
  //   const deletedTask = await this.taskService.delete(parseInt(id));
  //   if (deletedTask == null) {
  //     throw new NotFoundException(`Task with id ${id} not found`);
  //   }
  //   return deletedTask;
  // }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by id' })
  @ApiResponse({ status: 204, description: 'The task has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 422, description: 'Unprocessable Entity. Task has dependencies.' })
  async delete(@Param('id') id: string): Promise<TaskResponseDto> {
    try {
      const deletedTask = await this.taskService.delete(parseInt(id));
      if (!deletedTask) {
        throw new NotFoundException(`Task with id ${id} not found`);
      }
      return deletedTask;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new UnprocessableEntityException('Task cannot be deleted as it has dependent records (e.g., comments).');
      }
      throw error;
    }
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async findAllComments(@Param('id') taskId: string): Promise<Comment[]> {
    return this.commentService.findAll(parseInt(taskId));
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Create a new comment for a task' })
  @ApiResponse({ status: 201, description: 'Comment successfully created.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async createComment(@Param('id') taskId: string, @Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    createCommentDto.taskId = parseInt(taskId);
    return this.commentService.create(createCommentDto); 
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment for a task' })
  @ApiResponse({ status: 204, description: 'Comment successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async deleteComment(@Param('id') taskId: string, @Param('commentId') commentId: string): Promise<void> {
    await this.commentService.delete(parseInt(commentId));
  }

  @Get(':id/equipment')
  @ApiOperation({ summary: 'Get all equipment for a task' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async getEquipmentForTask(@Param('id') taskId: string) {
    return this.equipmentService.getEquipmentForTask(parseInt(taskId));
  }

  @Post(':id/equipment')
  @ApiOperation({ summary: 'Add equipment to a task' })
  @ApiResponse({ status: 201, description: 'Equipment added to task successfully.' })
  @ApiResponse({ status: 404, description: 'Task or equipment not found.' })
  async addEquipmentToTask(@Param('id') taskId: string, @Body('equipmentId') equipmentId: number) {
    return this.equipmentService.addEquipmentToTask(parseInt(taskId), equipmentId);
  }

  @Delete(':id/equipment/:equipmentId')
  @ApiOperation({ summary: 'Remove equipment from a task' })
  @ApiResponse({ status: 204, description: 'Equipment removed from task successfully.' })
  @ApiResponse({ status: 404, description: 'Task or equipment not found.' })
  async removeEquipmentFromTask(@Param('id') taskId: string, @Param('equipmentId') equipmentId: number) {
    return this.equipmentService.removeEquipmentFromTask(parseInt(taskId), equipmentId);
  }
}