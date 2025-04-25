import { Module } from '@nestjs/common';
import { FarmController } from './farm.controller';
import { FarmService } from './farm.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FarmController],
  providers: [FarmService, PrismaService],
})
export class FarmModule {}
