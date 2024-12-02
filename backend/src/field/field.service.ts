import { Injectable } from '@nestjs/common';
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

  async findAll(): Promise<Field[]> {
    return this.prisma.field.findMany({
      include: {
        crop: true,
      },
    });
  }

  async findOne(id: number): Promise<Field> {
    return this.prisma.field.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: Partial<Field>): Promise<Field> {
    return this.prisma.field.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<Field | null> {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) {
      return null;
    }
    await this.prisma.field.delete({ where: { id } });
    return field;
  }  
}
