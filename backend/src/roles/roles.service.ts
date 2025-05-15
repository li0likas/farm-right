import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllRoles(farmId: number) {
    return this.prisma.role.findMany({
      where: {
        farmPermissions: {
          some: { farmId: farmId },
        },
      },
      include: {
        farmPermissions: {
          where: { farmId: farmId },
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getAllPermissions(farmId: number) {
    return this.prisma.permission.findMany({
    });
  }

  async assignPermission(roleId: number, permissionId: number, farmId: number) {
    return this.prisma.farmRolePermission.create({
      data: {
        roleId,
        permissionId,
        farmId,
      },
    });
  }

  async removePermission(roleId: number, permissionId: number, farmId: number) {
    return this.prisma.farmRolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
        farmId,
      },
    });
  }
}