import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FarmMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getFarmMembers(farmId: number) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      include: { members: { include: { user: true, role: true } } }
    });

    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    return farm.members.map(member => ({
      id: member.user.id,
      username: member.user.username,
      email: member.user.email,
      role: member.role.name,
      roleId: member.role.id
    }));
  }

  async addFarmMember(farmId: number, userId: number, roleId: number) {
    const existingMember = await this.prisma.farmMember.findFirst({ where: { farmId, userId } });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this farm');
    }

    return this.prisma.farmMember.create({ data: { farmId, userId, roleId } });
  }

  async removeFarmMember(farmId: number, userId: number, requesterId: number) {
    // Prevent user from deleting themselves
    if (userId === requesterId) {
      throw new ForbiddenException("You cannot remove yourself from the farm.");
    }

    return this.prisma.farmMember.deleteMany({ where: { farmId, userId } });
  }

  async updateFarmMemberRole(farmId: number, userId: number, roleId: number, requesterId: number) {
    // Prevent user from changing their own role
    if (userId === requesterId) {
      throw new ForbiddenException("You cannot update your own role.");
    }

    return this.prisma.farmMember.updateMany({
      where: { farmId, userId },
      data: { roleId }
    });
  }
}
