import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const { taskId, content } = createCommentDto;

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found.`);
    }

    return this.prisma.comment.create({
      data: {
        content,
        task: { connect: { id: taskId } },
      },
    });
  }

  async findAll(taskId: number): Promise<Comment[]> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found.`);
    }

    return this.prisma.comment.findMany({ where: { taskId } });
  }

   async delete(id: number): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found.`);
    }

    return this.prisma.comment.delete({ where: { id } });
  }


    async findAllByTaskIdAndFieldId(fieldId: number, taskId: number) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { field: true }, 
      });
    
      if (!task || task.fieldId !== fieldId) {
        throw new NotFoundException(`Task with id ${taskId} not found in field ${fieldId}.`);
      }
    
      return this.prisma.comment.findMany({
        where: { taskId },
      });
    }
  
    async createCommentForTaskAndField(fieldId: number, taskId: number, createCommentDto: CreateCommentDto) {

      const task = await this.prisma.task.findFirst({
        where: { id: taskId, fieldId },
      });
  
      if (!task) {
        throw new NotFoundException(`Task with id ${taskId} not found in field ${fieldId}.`);
      }
  
      return this.prisma.comment.create({
        data: {
          taskId,
          ...createCommentDto,
        },
      });
    }
  
    async deleteCommentForTaskAndField(fieldId: number, taskId: number, commentId: number) {
      const task = await this.prisma.task.findFirst({
        where: { id: taskId, fieldId },
      });
  
      if (!task) {
        throw new NotFoundException(`Task with id ${taskId} not found in field ${fieldId}.`);
      }
  
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });
  
      if (!comment || comment.taskId !== taskId) {
        throw new NotFoundException(`Comment with id ${commentId} not found for task ${taskId} in field ${fieldId}.`);
      }
  
      return this.prisma.comment.delete({
        where: { id: commentId },
      });
    }
  }
