import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskStatusOptionsService {
  constructor(private prisma: PrismaService) {}

    async getAllTaskStatusOptions() {
        return this.prisma.taskStatusOptions.findMany();
    };
}