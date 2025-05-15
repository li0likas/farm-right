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

    const ownerRole = await this.prisma.role.findUnique({
      where: { name: 'OWNER' },
    });
    
    const workerRole = await this.prisma.role.findUnique({
      where: { name: 'WORKER' },
    });
    
    const agronomistRole = await this.prisma.role.findUnique({
      where: { name: 'AGRONOMIST' },
    });

    if (!ownerRole) throw new ForbiddenException('OWNER role not found');
    if (!workerRole) throw new ForbiddenException('WORKER role not found');
    if (!agronomistRole) throw new ForbiddenException('AGRONOMIST role not found');

    await this.prisma.farmMember.create({
      data: {
        userId,
        farmId: farm.id,
        roleId: ownerRole.id,
      },
    });

    const allPermissions = await this.prisma.permission.findMany({
      where: {
        name: { not: 'ADMIN_ACCESS' },
      },
    });

    const workerPermissions = await this.prisma.permission.findMany({
      where: {
        name: {
          in: [
            'FIELD_READ',
            'FIELD_TASK_READ',
            'FIELD_TASK_COMMENT_CREATE',
            'FIELD_TASK_COMMENT_READ',
            'TASK_READ',
            'EQUIPMENT_READ',
            'CROP_READ',
            'TASK_STATS_READ',
          ],
        },
      },
    });

    const agronomistPermissions = await this.prisma.permission.findMany({
      where: {
        name: {
          in: [
            // Worker permissions
            'FIELD_READ',
            'FIELD_TASK_READ',
            'FIELD_TASK_COMMENT_CREATE',
            'FIELD_TASK_COMMENT_READ',
            'TASK_READ',
            'EQUIPMENT_READ',
            'CROP_READ',
            'TASK_STATS_READ',
            // Additional agronomist permissions
            'FIELD_TASK_COMMENT_UPDATE',
            'FIELD_TASK_COMMENT_DELETE',
            'TASK_CHANGE_STATUS',
            'TASK_CREATE',
            'TASK_UPDATE',
            'FIELD_TOTAL_AREA_READ',
            'DASHBOARD_AI_SUMMARY',
          ],
        },
      },
    });

    for (const permission of allPermissions) {
      await this.prisma.farmRolePermission.create({
        data: {
          farmId: farm.id,
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      });
    }

    for (const permission of workerPermissions) {
      await this.prisma.farmRolePermission.create({
        data: {
          farmId: farm.id,
          roleId: workerRole.id,
          permissionId: permission.id,
        },
      });
    }

    for (const permission of agronomistPermissions) {
      await this.prisma.farmRolePermission.create({
        data: {
          farmId: farm.id,
          roleId: agronomistRole.id,
          permissionId: permission.id,
        },
      });
    }

    const seasons = [
      {
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
      },
      {
        name: '2025-2026',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-08-31'),
      },
      {
        name: '2026-2027',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-08-31'),
      },
    ];

    for (const season of seasons) {
      await this.prisma.season.create({
        data: {
          name: season.name,
          startDate: season.startDate,
          endDate: season.endDate,
          farmId: farm.id,
        },
      });
    }

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