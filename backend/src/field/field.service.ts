import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Field } from '@prisma/client';
import { CreateFieldDto } from './dto/create-field.dto';

@Injectable()
export class FieldService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateFieldDto): Promise<Field> {
    return this.prisma.field.create({
      data,
    });
  } 

  async findAll(userId: number, selectedFarmId: number): Promise<Field[]> {
    return this.prisma.field.findMany({
      where: {
        farmId: selectedFarmId,
      },
      include: {
        crop: true,
        farm: true,
      },
    });
  }

  async findOne(id: number, selectedFarmId: number): Promise<Field> {
    return this.prisma.field.findFirst({
      where: { 
        id, 
        farmId: selectedFarmId,
      },
      include: {
        crop: true,
        farm: true,
      },
    });
  }

  async update(id: number, data: Partial<Field>, selectedFarmId: number): Promise<Field> {
    return this.prisma.field.update({
      where: { 
        id,
        farmId: selectedFarmId,
      },
      data,
    });
  }

  async delete(id: number, selectedFarmId: number): Promise<Field | null> {
    const field = await this.prisma.field.findFirst({ 
      where: { id, farmId: selectedFarmId },
    });
  
    if (!field) {
      throw new NotFoundException(`Field with ID ${id} was not found in the selected farm`);
    }
  
    await this.prisma.field.delete({ where: { id } });
    return field;
  }
  
  async findCurrentUserFields(userId: number, selectedFarmId: number): Promise<Field[]> {
    return this.prisma.field.findMany({
      where: {
        farmId: selectedFarmId,
        OR: [
          { ownerId: userId },
          { farm: { members: { some: { userId } } } },
        ],
      },
      include: {
        crop: true,
        farm: true,
      },
    });
  }
  
  async getTotalFieldArea(farmId: number): Promise<number> {
    const fields = await this.prisma.field.findMany({
        where: { farmId },
        select: { area: true },
    });

    return fields.reduce((sum, field) => sum + field.area, 0);
  }
}
