import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TaskTypeOptionsModule } from '../task/taskTypeOptions/taskTypeOptions.module';

@Module({
  imports: [HttpModule, TaskTypeOptionsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}