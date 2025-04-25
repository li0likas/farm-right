import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../auth/mail/mail.service';
import { User } from '@prisma/client';

@Injectable()
export class FarmInvitationService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.jwtSecret = this.configService.get<string>('jwt.secret');
    this.jwtExpiresIn = this.configService.get<string>('jwt.farmInvitationExpires') || '7d';
  }

  async createInvitation(farmId: number, email: string, roleId: number) {
    // Check if the farm exists
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if user with email exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Check if user is already a member of this farm
    if (user) {
      const existingMember = await this.prisma.farmMember.findFirst({
        where: { userId: user.id, farmId },
      });

      if (existingMember) {
        throw new ForbiddenException('User is already a member of this farm');
      }
    }

    // Generate invitation token
    const payload = {
      email,
      farmId,
      roleId,
      type: 'farm-invitation',
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.jwtExpiresIn,
      secret: this.jwtSecret,
    });

    // Store the invitation in the database
    const invitation = await this.prisma.farmInvitation.create({
      data: {
        email,
        token,
        farmId,
        roleId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Send the invitation email
    await this.sendInvitationEmail(email, token, farm.name);

    return invitation;
  }

  async acceptInvitation(token: string, user: any) {
    const invitation = await this.prisma.farmInvitation.findFirst({
      where: { token },
      include: { farm: true },
    });
  
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }    
  
    if (new Date() > invitation.expiresAt) {
      throw new ForbiddenException('Invitation has expired');
    }
  
    if (user.email !== invitation.email) {
      throw new ForbiddenException('This invitation is not for your email address');
    }
  
    const existingMember = await this.prisma.farmMember.findFirst({
      where: {
        userId: user.id,
        farmId: invitation.farmId,
      },
    });
  
    if (existingMember) {
      await this.prisma.farmInvitation.delete({ where: { id: invitation.id } });
  
      return {
        success: true,
        message: 'You are already a member of this farm',
        farmName: invitation.farm.name,
        alreadyMember: true,
      };
    }
  
    await this.prisma.farmMember.create({
      data: {
        userId: user.id,
        farmId: invitation.farmId,
        roleId: invitation.roleId,
      },
    });
  
    await this.prisma.farmInvitation.delete({
      where: { id: invitation.id },
    });
  
    return {
      success: true,
      message: `You have successfully joined ${invitation.farm.name}`,
      farmName: invitation.farm.name,
      justAccepted: true,
    };
  }
  

  async verifyInvitation(token: string) {
    const invitation = await this.prisma.farmInvitation.findFirst({
      where: { token },
      include: { farm: true },
    });
  
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (new Date() > invitation.expiresAt) {
      throw new ForbiddenException('Invitation has expired');
    }
  
    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });
  
    const alreadyProcessed = user
      ? await this.prisma.farmMember.findFirst({
          where: {
            userId: user.id,
            farmId: invitation.farmId,
          },
        })
      : null;
  
    return {
      success: true,
      farmName: invitation.farm.name,
      email: invitation.email,
      alreadyProcessed: !!alreadyProcessed,
      requiresRegistration: !user,
    };
  }  

  async getPendingInvitationsByEmail(email: string) {
    const pendingInvitations = await this.prisma.farmInvitation.findMany({
      where: { 
        email,
        expiresAt: { gt: new Date() }
      },
      include: {
        farm: true,
        role: true
      }
    });

    return pendingInvitations.map(invitation => ({
      id: invitation.id,
      token: invitation.token,
      farmId: invitation.farmId,
      farmName: invitation.farm.name,
      roleName: invitation.role.name,
      expiresAt: invitation.expiresAt
    }));
  }

  private async sendInvitationEmail(email: string, token: string, farmName: string) {
    const baseUrl = this.configService.get<string>('app.baseUrl') || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invitation/${token}`;

    // Mock user object for mail service
    const mockUser: Partial<User> = {
      email,
      username: email.split('@')[0] // Simple username from email
    };

    await this.mailService.sendFarmInvitation(mockUser as User, token, farmName);
    
    return true;
  }
}