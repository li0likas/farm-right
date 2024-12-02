import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FieldCropOptionsService {
  constructor(private prisma: PrismaService) {}

  async getFieldCropOptions() {
    try {
      const cropOptions = await this.prisma.fieldCropOptions.findMany();
      return cropOptions;
    } catch (error) {
      throw new Error('Error fetching crop options');
    }
  };
}