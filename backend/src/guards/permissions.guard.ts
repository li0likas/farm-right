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
      return true; 
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as AuthenticatedUser;
    const selectedFarmId = req.headers['x-selected-farm-id'];
    const userId = user.id;

    if (!userId || !selectedFarmId) {
        throw new ForbiddenException('User or selected farm not found.');
    }  
    const farmId = parseInt(selectedFarmId as string);

    const farmMember = await this.prisma.farmMember.findUnique({
        where: { userId_farmId: { userId, farmId } },
        include: {
          role: {
            include: {
              farmPermissions: {
                where: { farmId }, 
                include: { permission: true },
              },
            },
          },
        },
      });
    
    if (!farmMember) {
    throw new ForbiddenException('User does not belong to the selected farm.');
    }
    
      

    const userPermissions = farmMember.role.farmPermissions.map((fp) => fp.permission.name);


    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions.');
    }

    return true;
  }
}
