import { Module } from '@nestjs/common';
import { TaskStatusOptionsController } from './taskStatusOptions.controller';
import { TaskStatusOptionsService } from './taskStatusOptions.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TaskStatusOptionsController],
  providers: [TaskStatusOptionsService, PrismaService],
})
export class TaskStatusOptionsModule {}
