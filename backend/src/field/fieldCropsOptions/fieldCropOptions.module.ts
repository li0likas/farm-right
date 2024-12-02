import { Module } from '@nestjs/common';
import { FieldCropOptionsController } from './fieldCropOptions.controller';
import { FieldCropOptionsService } from './fieldCropOptions.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [FieldCropOptionsController],
  providers: [FieldCropOptionsService, PrismaService],
})
export class FieldCropOptionsModule {}
