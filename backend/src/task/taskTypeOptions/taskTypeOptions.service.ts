import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskTypeOptions } from '@prisma/client';

@Injectable()
export class TaskTypeOptionsService {
  constructor(private prisma: PrismaService) {}

    async getAllTaskTypeOptions() {
        return this.prisma.taskTypeOptions.findMany();
    };

    async getTaskTypeNameById(id: number): Promise<string> {
        const taskType = await this.prisma.taskTypeOptions.findUnique({
          where: { id: Number(id) }, // Ensure id is an integer
        });
        if (!taskType) {
          throw new NotFoundException(`Task type with id ${id} not found`);
        }
        return taskType.name; // Return only the name property
      }
}