import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EquipmentTypeOptionsService {
  constructor(private prisma: PrismaService) {}

  async getAllEquipmentTypeOptions() {
    return this.prisma.equipmentTypeOptions.findMany();
  }

  async getEquipmentTypeOptionById(id: number) {
    const equipmentTypeOption = await this.prisma.equipmentTypeOptions.findUnique({
      where: { id },
    });
    if (!equipmentTypeOption) {
      throw new NotFoundException(`Equipment type option with id ${id} not found`);
    }
    return equipmentTypeOption;
  }

  async createEquipmentTypeOption(name: string) {
    return this.prisma.equipmentTypeOptions.create({
      data: { name },
    });
  }

  async updateEquipmentTypeOption(id: number, name: string) {
    return this.prisma.equipmentTypeOptions.update({
      where: { id },
      data: { name },
    });
  }

  async deleteEquipmentTypeOption(id: number) {
    return this.prisma.equipmentTypeOptions.delete({
      where: { id },
    });
  }
}