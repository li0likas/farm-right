import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FarmService {
  constructor(private readonly prisma: PrismaService) {}

  async createFarm(user: any, name: string) {
    const userId = user.id;
    if (!userId) throw new Error('User ID missing');
  
    const farmCount = await this.prisma.farm.count({
      where: { ownerId: userId },
    });
  
    if (farmCount >= 3) {
      throw new ForbiddenException('Maximum of 3 farms allowed per user');
    }
  
    const farm = await this.prisma.farm.create({
      data: {
        name,
        ownerId: userId,
      },
    });
  
    const role = await this.prisma.role.findUnique({
      where: { name: 'OWNER' },
    });
  
    if (!role) throw new ForbiddenException('OWNER role not found');
  
    await this.prisma.farmMember.create({
      data: {
        userId,
        farmId: farm.id,
        roleId: role.id,
      },
    });
  
    return farm;
  }

  async getFarmDetails(id: number) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: {
        members: true,
        fields: {
          include: {
            tasks: true
          }
        },
        equipments: true,
      },
    });
  
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
  
    const tasksCount = farm.fields.reduce((sum, field) => sum + field.tasks.length, 0);
  
    return {
      id: farm.id,
      name: farm.name,
      ownerId: farm.ownerId,
      membersCount: farm.members.length,
      fieldsCount: farm.fields.length,
      equipmentsCount: farm.equipments.length,
      tasksCount,
    };
  }  

  async renameFarm(farmId: number, newName: string, userId: number) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });

    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    if (farm.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this farm');
    }

    if (newName.length < 3) {
      throw new ForbiddenException('Farm name must be at least 3 characters long');
    }

    return this.prisma.farm.update({
      where: { id: farmId },
      data: { name: newName },
    });
  }

  async deleteFarm(farmId: number, userId: number) {
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
  
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }
  
    if (farm.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete this farm');
    }
  
    await this.prisma.taskParticipant.deleteMany({
      where: { task: { field: { farmId } } },
    });
  
    await this.prisma.task.deleteMany({
      where: { field: { farmId } },
    });
  
    await this.prisma.field.deleteMany({
      where: { farmId },
    });
  
    await this.prisma.farmMember.deleteMany({
      where: { farmId },
    });
  
    await this.prisma.equipment.deleteMany({
      where: { farmId },
    });
  
    await this.prisma.season.deleteMany({
      where: { farmId },
    });
  
    await this.prisma.farmInvitation.deleteMany({
      where: { farmId },
    });
  
    await this.prisma.farmRolePermission.deleteMany({
      where: { farmId },
    });
  
    return this.prisma.farm.delete({
      where: { id: farmId },
    });
  }

  async leaveFarm(userId: number, farmId: number) {
    const membership = await this.prisma.farmMember.findFirst({
      where: {
        userId,
        farmId,
      },
    });
  
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
  
    // Do not allow leaving own farm (Owner must delete)
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (farm.ownerId === userId) {
      throw new ForbiddenException('Owner must delete farm instead of leaving');
    }
  
    await this.prisma.farmMember.delete({
      where: { id: membership.id },
    });
  
    return { success: true };
  }
}