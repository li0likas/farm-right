import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { FieldModule } from './field/field.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';
import { FieldCropOptionsModule } from './field/fieldCropsOptions/fieldCropOptions.module';
import { TaskTypeOptionsModule } from './task/taskTypeOptions/taskTypeOptions.module';
import { TaskStatusOptionsModule } from './task/taskStatusOptions/taskStatusOptions.module';
import { FarmMembersModule } from './farm-members/farm-members.module';
import { WeatherModule } from './weather/weather.module';
import { AiModule } from './ai/ai.module';
import { EquipmentModule } from './equipment/equipment.module';
import { EquipmentTypeOptionsModule } from './equipment/equipmentTypeOptions/equipmentTypeOptions.module';
import { RolesModule } from './roles/roles.module';
import { SeasonModule } from './season/season.module';
import { FarmModule } from './farm/farm.module';
import { ReportModule } from './report/report.module';
import configuration from './config/configuration';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3333),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        OPENWEATHER_API_KEY: Joi.string().required(),
        OPENAI_API_KEY: Joi.string().required(),
        USER: Joi.string().optional(), // For email service
        PASSWORD: Joi.string().optional(), // For email service
        USER_PHOTO_PATH: Joi.string().optional(),
        // Add other environment variables as needed
      }),
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    FieldModule,
    TaskModule,
    CommentModule,
    FieldCropOptionsModule,
    TaskTypeOptionsModule,
    TaskStatusOptionsModule,
    WeatherModule,
    AiModule,
    EquipmentModule,
    EquipmentTypeOptionsModule,
    FarmMembersModule,
    RolesModule,
    SeasonModule,
    FarmModule,
    ReportModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}