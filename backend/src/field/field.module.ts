import { Module } from '@nestjs/common';
import { FieldService } from './field.service';
import { FieldController } from './field.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
//import { MailModule } from "./mail/mail.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy";
import { UserService } from 'src/user/user.service';

@Module({
  imports: [JwtModule.register({}), AuthModule, /*MailModule*/],
  controllers: [FieldController],
  providers: [FieldService, PrismaService, JwtStrategy, UserService],
})
export class FieldModule {}
