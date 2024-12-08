import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskTypeOptionsService {
  constructor(private prisma: PrismaService) {}

    async getAllTaskTypeOptions() {
        return this.prisma.taskTypeOptions.findMany();
    };
}