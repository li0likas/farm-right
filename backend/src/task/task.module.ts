import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
//import { MailModule } from "./mail/mail.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../field/strategy";
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, PrismaService, JwtStrategy, UserService],

})
export class TaskModule {}
