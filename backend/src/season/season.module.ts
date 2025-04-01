import { Module } from '@nestjs/common';
import { SeasonService } from './season.service';
import { SeasonController } from './season.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from '../auth/strategy';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [SeasonController],
  providers: [SeasonService, PrismaService, JwtStrategy, UserService],
})
export class SeasonModule {}
