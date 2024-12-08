import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Task } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDto): Promise<Task> {
    const { fieldId, typeId, description, dueDate, completionDate, status } = data;

    const fieldExists = await this.prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!fieldExists) {
      throw new NotFoundException(`Field with id ${fieldId} not found`);
    }

    return this.prisma.task.create({
      data: {
        description,
        dueDate,
        completionDate,
        status,
        field: { connect: { id: fieldId } },
        type: { connect: { id: typeId } },
      },
    });
  }

  async findAll(userId: number): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        field: {
          ownerId: userId,
        },
      },
      include: {
        field: true,
        type: true,
        comments: true,
      },
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        field: true,
        type: true,
        comments: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async update(id: number, data: Partial<Task>): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      return null;
    }
    await this.prisma.task.delete({ where: { id } });
    return task;
  }

  async findAllTasksForField(fieldId: number): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { fieldId },
      include: {
        type: true,
      },
    });
  }

  async createTaskForField(fieldId: number, data: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: {
        ...data,
        fieldId,
      },
    });
  }

  async updateTaskForField(fieldId: number, taskId: number, data: Partial<Task>): Promise<Task> {
    return this.prisma.task.update({
      where: { id: taskId, fieldId },
      data,
    });
  }

  async deleteTaskForField(fieldId: number, taskId: number): Promise<Task | null> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId, fieldId } });
    if (!task) {
      return null;
    }
    await this.prisma.task.delete({ where: { id: taskId, fieldId } });
    return task;
  }
}
