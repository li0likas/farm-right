import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, NotFoundException, Request, ForbiddenException, BadRequestException, Req, HttpStatus, HttpException } from '@nestjs/common';
import { FieldService } from './field.service';
import { CommentService } from '../comment/comment.service';
import { TaskService } from '../task/task.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { CreateCommentDto } from '../comment/dto/create-comment.dto';
import { CreateTaskDto } from '../task/dto/create-task.dto';
import { FieldResponseDto } from './dto/field-response.dto';
import { TaskResponseDto } from '../task/dto/task-response.dto';
import { Field, Task } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@ApiTags('fields')
@Controller('fields')
export class FieldController {
  constructor(
    private readonly fieldsService: FieldService,
    private readonly commentService: CommentService,
    private readonly taskService: TaskService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new field' })
  @ApiResponse({ status: 201, description: 'The field has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Request() req): Promise<Field> {
    const ownerId = req.user.id;
    var {name, area, perimeter, cropId } = req.body;

    const createFieldDto: CreateFieldDto = {
      name, area, perimeter, cropId, ownerId: parseInt(ownerId),
    };

    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fields' })
  @ApiResponse({ status: 200, description: 'The fields have been successfully retrieved.', type: [FieldResponseDto] })
  async findAll(@Request() req): Promise<Field[]> {
    const userId = req.user.id;
    return this.fieldsService.findAll(parseInt(userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully retrieved.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findOne(@Request() req, @Param('id') id: string): Promise<FieldResponseDto> {
    const userId = req.user.id;
    try {
      if ( !== userId) {
        throw new HttpException('You do not have permission to access this field', HttpStatus.FORBIDDEN);
      }

      // const user = await this.groupService.findCurrentUserGroups(req.user.id);
      // const userIsMember = userGroups.some(group => group.id === gid);
      // if (!userIsMember && group.visibilityId == 2) {
      //   throw new HttpException(
      //     'You are not a member of this group and cannot view its events',
      //     HttpStatus.FORBIDDEN,
      //   );
      // }

      const field = await this.fieldsService.findOne(fieldId);
      if (!field) {
        throw new HttpException(`Field with id ${id} not found`, HttpStatus.NOT_FOUND);
      }

      return field;
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully updated.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async update(@Param('id') id: string, @Body() field: Partial<Field>): Promise<Field> {
    return this.fieldsService.update(parseInt(id), field);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully deleted.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async delete(@Param('id') id: string): Promise<FieldResponseDto> {
    const deletedField = await this.fieldsService.delete(parseInt(id));
    if (deletedField == null) {
      throw new NotFoundException(`Field with id ${id} not found`);
    }
    return deletedField;
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get all tasks for a field' })
  @ApiResponse({ status: 200, description: 'The tasks have been successfully retrieved.', type: [TaskResponseDto] })
  async findAllTasks(@Param('id') id: string): Promise<Task[]> {
    return this.taskService.findAllTasksForField(parseInt(id));
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Create a new task for a field' })
  @ApiResponse({ status: 201, description: 'The task has been successfully created.', type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async createTask(@Param('id') id: string, @Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskService.createTaskForField(parseInt(id), createTaskDto);
  }

  // @Put(':id/tasks/:taskId')
  // @ApiOperation({ summary: 'Update a task for a field' })
  // @ApiResponse({ status: 200, description: 'The task has been successfully updated.', type: TaskResponseDto })
  // @ApiResponse({ status: 404, description: 'Task not found.' })
  // async updateTask(@Param('id') id: string, @Param('taskId') taskId: string, @Body() task: Partial<Task>): Promise<Task> {
  //   return this.taskService.updateTaskForField(parseInt(id), parseInt(taskId), task);
  // }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Delete a task for a field' })
  @ApiResponse({ status: 200, description: 'The task has been successfully deleted.', type: TaskResponseDto })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async deleteTask(@Param('id') id: string, @Param('taskId') taskId: string): Promise<Task> {
    const deletedTask = await this.taskService.deleteTaskForField(parseInt(id), parseInt(taskId));
    if (deletedTask == null) {
      throw new NotFoundException(`Task with id ${taskId} not found in field ${id}`);
    }
    return deletedTask;
  }

  @Get(':id/tasks/:taskId/comments')
  async findAllCommentsForTask(
    @Param('id') fieldId: string,
    @Param('taskId') taskId: string
  ) {
    const parsedFieldId = parseInt(fieldId);
    const parsedTaskId = parseInt(taskId);

    // Validate that both IDs are valid numbers
    if (isNaN(parsedFieldId) || isNaN(parsedTaskId)) {
      throw new BadRequestException('Invalid fieldId or taskId provided.');
    }

    const comments = await this.commentService.findAllByTaskIdAndFieldId(parsedFieldId, parsedTaskId);

    if (!comments.length) {
      throw new NotFoundException(`No comments found for task ${taskId} in field ${fieldId}`);
    }

    return comments;
  }

  @Post(':id/tasks/:taskId/comments')
  async createComment(
    @Param('fieldId') fieldId: string,
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.createCommentForTaskAndField(parseInt(fieldId), parseInt(taskId), createCommentDto);
  }

  @Delete(':id/tasks/:taskId/comments')
  async deleteComment(
    @Param('fieldId') fieldId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.deleteCommentForTaskAndField(parseInt(fieldId), parseInt(taskId), parseInt(commentId));
  }
}