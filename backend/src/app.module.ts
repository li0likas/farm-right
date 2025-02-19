import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { FieldModule } from './field/field.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';
import { FieldCropOptionsModule } from './field/fieldCropsOptions/fieldCropOptions.module';
// import { CronModule } from './cron/task-cron.module';
import { TaskTypeOptionsModule } from './task/taskTypeOptions/taskTypeOptions.module';
import { TaskStatusOptionsModule } from './task/taskStatusOptions/taskStatusOptions.module';
import { WeatherModule } from './weather/weather.module';
import { AiModule } from './ai/ai.module';
import { EquipmentModule } from './equipment/equipment.module';
import { EquipmentTypeOptionsModule } from './equipment/equipmentTypeOptions/equipmentTypeOptions.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true}), AuthModule, UserModule, PrismaModule, FieldModule,
    TaskModule, CommentModule, FieldCropOptionsModule, TaskTypeOptionsModule, TaskStatusOptionsModule,
    WeatherModule, AiModule, EquipmentModule, EquipmentTypeOptionsModule
    /*, CronModule*/],
  controllers: [],
  providers: [],
})
export class AppModule {}
