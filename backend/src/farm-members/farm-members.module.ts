import { Module } from '@nestjs/common';
import { FarmMembersService } from './farm-members.service';
import { FarmMembersController } from './farm-members.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FarmMembersController],
  providers: [FarmMembersService, PrismaService],
  exports: [FarmMembersService], // Export if needed elsewhere
})
export class FarmMembersModule {}
