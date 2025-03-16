import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

interface AuthenticatedUser {
  id: number; // User ID from JWT
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) {
      return true; // if no permissions are required, allow access
    }

    const req = context.switchToHttp().getRequest<Request>();
    //console.log("REQ.USER:", req.user); // 🔴 DEBUGGING: Log `req.user`
    const user = req.user as AuthenticatedUser;
    const selectedFarmId = req.headers['x-selected-farm-id'];
    const userId = user.id;

    if (!userId || !selectedFarmId) {
        throw new ForbiddenException('User or selected farm not found.');
    }  
    const farmId = parseInt(selectedFarmId as string);

    // ✅ Fetch user's role and permissions for the selected farm
    const farmMember = await this.prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } }, // ✅ Only fetch for the selected farm
        include: {
          role: {
            include: {
              farmPermissions: {
                where: { farmId }, // ✅ Filter permissions for the selected farm
                include: { permission: true },
              },
            },
          },
        },
      });
    
    if (!farmMember) {
    throw new ForbiddenException('User does not belong to the selected farm.');
    }
    
    // 🔴 Debugging
    console.log("Full farmMember Object:", JSON.stringify(farmMember, null, 2));
      

    // ✅ Extract user's permissions from their assigned role
    const userPermissions = farmMember.role.farmPermissions.map((fp) => fp.permission.name);

    console.log("UserPermissions:", userPermissions);
    console.log("RequiredPermissions:", requiredPermissions);

    // ✅ Check if user has **ALL** required permissions
    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions.');
    }

    return true;
  }
}
