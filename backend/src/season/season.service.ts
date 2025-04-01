import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeasonService {
  constructor(private readonly prisma: PrismaService) {}

  async findByFarm(farmId: number) {
    return this.prisma.season.findMany({
      where: { farmId },
      orderBy: { startDate: 'desc' },
    });
  }
}