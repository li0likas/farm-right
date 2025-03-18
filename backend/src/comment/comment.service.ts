import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, farmId: number): Promise<Comment> {
    const { taskId, content } = createCommentDto;
  
    // Ensure the task exists within the selected farm
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        field: {
          farmId, // Ensure task belongs to the farm
        },
      },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found in farm ${farmId}.`);
    }
  
    return this.prisma.comment.create({
      data: {
        content,
        task: { connect: { id: taskId } },
      },
    });
  }

  async findAll(taskId: number, farmId: number): Promise<Comment[]> {
    // Ensure the task exists within the selected farm
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        field: {
          farmId, // Ensure task belongs to the farm
        },
      },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found in farm ${farmId}.`);
    }
  
    return this.prisma.comment.findMany({
      where: { taskId },
    });
  }
  
  async delete(commentId: number, farmId: number): Promise<Comment> {
    // Ensure the comment exists and belongs to a task in the selected farm
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        task: {
          field: {
            farmId, // Ensure task belongs to the farm
          },
        },
      },
    });
  
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found in farm ${farmId}.`);
    }
  
    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }

  async findAllByTaskIdAndFieldId(fieldId: number, taskId: number, farmId: number): Promise<Comment[]> {
    // Ensure the task exists within the selected farm and field
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        fieldId: fieldId,
        field: {
          farmId, // Ensure task belongs to the farm
        },
      },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found in field ${fieldId} and farm ${farmId}.`);
    }
  
    return this.prisma.comment.findMany({
      where: { taskId },
    });
  }

  async createCommentForTaskAndField(fieldId: number, taskId: number, farmId: number, createCommentDto: CreateCommentDto): Promise<Comment> {
    // Ensure the task exists within the selected farm and field
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        fieldId,
        field: {
          farmId, // Ensure task belongs to the farm
        },
      },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found in field ${fieldId} of farm ${farmId}.`);
    }
  
    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        task: { connect: { id: taskId } },
      },
    });
  }

  async deleteCommentForTaskAndField(fieldId: number, taskId: number, commentId: number, farmId: number) {
    // Ensure the task exists within the selected farm and field
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        fieldId,
        field: {
          farmId, // Ensure task belongs to the farm
        },
      },
    });
  
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found in field ${fieldId} of farm ${farmId}.`);
    }
  
    // Ensure the comment exists and is part of the correct task & farm
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        taskId,
        task: {
          field: {
            farmId, // Ensure comment belongs to the correct farm
          },
        },
      },
    });
  
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found for task ${taskId} in field ${fieldId} of farm ${farmId}.`);
    }
  
    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}