import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust the import path based on your project structure
import { Task } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { fieldId, ...taskData } = createTaskDto;

    const fieldExists = await this.prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!fieldExists) {
      throw new NotFoundException(`Field with id ${fieldId} not found`);
    }

    return this.prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        field: { connect: { id: fieldId } }, 
      },
    });
  }

  async findAll(): Promise<Task[]> {
    return this.prisma.task.findMany();
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
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
}
