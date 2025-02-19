import { Module } from '@nestjs/common';
import { EquipmentTypeOptionsService } from './equipmentTypeOptions.service';
import { EquipmentTypeOptionsController } from './equipmentTypeOptions.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [EquipmentTypeOptionsController],
  providers: [EquipmentTypeOptionsService, PrismaService],
  exports: [EquipmentTypeOptionsService],
})
export class EquipmentTypeOptionsModule {}