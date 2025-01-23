import { Module } from '@nestjs/common';
import { TaskTypeOptionsController } from './taskTypeOptions.controller';
import { TaskTypeOptionsService } from './taskTypeOptions.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TaskTypeOptionsController],
  providers: [TaskTypeOptionsService, PrismaService],
  exports: [TaskTypeOptionsService],
})
export class TaskTypeOptionsModule {}
