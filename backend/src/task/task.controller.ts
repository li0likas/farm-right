import { Controller, Post, Body, Get, Param, Put, Delete, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaskResponseDto } from './dto/task-response.dto';
import { Prisma } from '@prisma/client';


@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

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
  async findAll(): Promise<TaskResponseDto[]> {
    return this.taskService.findAll();
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
}