import { Module } from '@nestjs/common';
import { FieldService } from './field.service';
import { FieldController } from './field.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
//import { MailModule } from "./mail/mail.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../auth/strategy";
import { UserService } from 'src/user/user.service';
import { CommentModule } from 'src/comment/comment.module';
import { CommentController } from 'src/comment/comment.controller';
import { CommentService } from 'src/comment/comment.service';
import { TaskService } from '../task/task.service';

@Module({
  imports: [JwtModule.register({}), AuthModule, CommentModule /*MailModule*/],
  controllers: [FieldController, CommentController],
  providers: [FieldService, PrismaService, JwtStrategy, UserService, CommentService, TaskService],
})
export class FieldModule {}
