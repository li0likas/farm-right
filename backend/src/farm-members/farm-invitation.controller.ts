import { Controller, Post, Body, Get, Param, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { FarmInvitationService } from './farm-invitation.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('farm-invitations')
export class FarmInvitationController {
  constructor(private readonly farmInvitationService: FarmInvitationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('FARM_MEMBER_INVITE')
  async inviteUser(
    @Request() req,
    @Body() { email, roleId }: { email: string; roleId: number }
  ) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);
    if (!selectedFarmId) {
      throw new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST);
    }

    return this.farmInvitationService.createInvitation(selectedFarmId, email, roleId);
  }

  @Get('check-pending')
  @UseGuards(AuthGuard('jwt'))
  async checkPendingInvitations(@Request() req) {
    const user = req.user;
    return this.farmInvitationService.getPendingInvitationsByEmail(user.email);
  }

  @Get(':token')
  async verifyInvitation(@Param('token') token: string) {
    try {
      return await this.farmInvitationService.acceptInvitation(token);
    } catch (error) {
      // Handle special case for already accepted invitations
      if (error.message && error.message.includes('already a member')) {
        return {
          success: true,
          message: error.message,
          alreadyMember: true
        };
      }
      throw error;
    }
  }
}