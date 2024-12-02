import { Module } from '@nestjs/common';
import { TaskCronService } from './task-cron.service';

@Module({
  providers: [TaskCronService],
})
export class CronModule {}
