import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Get all roles but only for the selected farm
  async getAllRoles(farmId: number) {
    return this.prisma.role.findMany({
      where: {
        farmPermissions: {
          some: { farmId: farmId }, // ✅ Filter by selected farmId
        },
      },
      include: {
        farmPermissions: {
          where: { farmId: farmId }, // ✅ Only permissions related to this farm
          include: {
            permission: true,
          },
        },
      },
    });
  }

  // ✅ Get all permissions
  async getAllPermissions(farmId: number) {
    return this.prisma.permission.findMany({
    //   where: {
    //     farmPermissions: {
    //       some: { farmId: farmId }, // ✅ Filter by selected farmId
    //     },
    //   },
    });
  }

  // ✅ Assign a permission to a role for the selected farm
  async assignPermission(roleId: number, permissionId: number, farmId: number) {
    return this.prisma.farmRolePermission.create({
      data: {
        roleId,
        permissionId,
        farmId,
      },
    });
  }

  // ✅ Remove a permission from a role only for the selected farm
  async removePermission(roleId: number, permissionId: number, farmId: number) {
    return this.prisma.farmRolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
        farmId, // ✅ Ensure only for the selected farm
      },
    });
  }
}
