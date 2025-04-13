import { Module } from '@nestjs/common';
import { FarmMembersService } from './farm-members.service';
import { FarmMembersController } from './farm-members.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { FarmInvitationService } from './farm-invitation.service';
import { FarmInvitationController } from './farm-invitation.controller';
import { JwtService } from '@nestjs/jwt';
import { MailModule } from '../auth/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [FarmMembersController, FarmInvitationController],
  providers: [
    FarmMembersService, 
    FarmInvitationService, 
    PrismaService, 
    JwtService
  ],
  exports: [FarmMembersService, FarmInvitationService],
})
export class FarmMembersModule {}