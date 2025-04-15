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

  async acceptInvitation(token: string) {
    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtSecret,
      });

      // Check if this is a valid farm invitation token
      if (payload.type !== 'farm-invitation') {
        throw new ForbiddenException('Invalid invitation token');
      }

      // Extract information from the token
      const { email, farmId, roleId } = payload;

      // Check if invitation still exists in database
      const invitation = await this.prisma.farmInvitation.findFirst({
        where: { token },
        include: { farm: true },
      });

      // If the invitation doesn't exist in the database anymore
      if (!invitation) {
        // Check if the user with this email is already a farm member
        // using the information from the token
        const user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          const existingMember = await this.prisma.farmMember.findFirst({
            where: { userId: user.id, farmId },
          });

          if (existingMember) {
            // Find farm name
            const farm = await this.prisma.farm.findUnique({
              where: { id: farmId },
            });

            // User is already a member
            return { 
              success: true, 
              message: 'You are already a member of this farm',
              farmName: farm?.name || 'the farm',
              alreadyProcessed: true
            };
          }
        }

        // If we get here, the invitation was deleted but user is not a member
        throw new NotFoundException('Invitation not found');
      }

      // Check if invitation has expired
      if (new Date() > invitation.expiresAt) {
        throw new ForbiddenException('Invitation has expired');
      }

      // Find the user
      const user = await this.prisma.user.findUnique({
        where: { email: invitation.email },
      });

      // Check if user already joined the farm
      if (user) {
        const existingMember = await this.prisma.farmMember.findFirst({
          where: { userId: user.id, farmId: invitation.farmId },
        });

        if (existingMember) {
          // Delete the invitation since it's been used
          await this.prisma.farmInvitation.delete({
            where: { id: invitation.id },
          });
          
          return { 
            success: true, 
            message: 'You are already a member of this farm',
            farmName: invitation.farm.name,
            alreadyMember: true
          };
        }
      }

      // If user doesn't exist, they need to register first
      if (!user) {
        return {
          success: false,
          message: 'Please register an account with this email first',
          requiresRegistration: true,
          email: invitation.email,
          farmId: invitation.farmId,
          farmName: invitation.farm.name
        };
      }

      // Add user to farm
      await this.prisma.farmMember.create({
        data: {
          userId: user.id,
          farmId: invitation.farmId,
          roleId: invitation.roleId,
        },
      });

      // Delete the invitation since it's been used
      await this.prisma.farmInvitation.delete({
        where: { id: invitation.id },
      });

      return { 
        success: true, 
        message: `You have successfully joined ${invitation.farm.name}`,
        farmName: invitation.farm.name,
        justAccepted: true
      };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new ForbiddenException('Invalid or expired invitation token');
    }
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