import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { FarmMembersService } from './farm-members.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { request } from 'http';

@Controller('farm-members')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class FarmMembersController {
  constructor(private readonly farmMembersService: FarmMembersService) {}

  @Get()
  @Permissions('FARM_MEMBER_READ')
  async getFarmMembers(@Request() req) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);
    if (!selectedFarmId) {
      throw new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST);
    }

    return this.farmMembersService.getFarmMembers(selectedFarmId);
  }

  @Post()
  @Permissions('FARM_MEMBER_INVITE')
  async addFarmMember(
    @Request() req,
    @Body() { userId, roleId }: { userId: string; roleId: string }
  ) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);
    if (!selectedFarmId) {
      throw new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST);
    }

    return this.farmMembersService.addFarmMember(selectedFarmId, parseInt(userId), parseInt(roleId));
  }

  @Delete(':userId')
  @Permissions('FARM_MEMBER_REMOVE')
  async removeFarmMember(@Request() req, @Param('userId') userId: string) {
    const requesterId = req.user.id; // get the current user ID
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);
    if (!selectedFarmId) {
      throw new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST);
    }

    return this.farmMembersService.removeFarmMember(selectedFarmId, parseInt(userId), requesterId);
  }

  @Patch(':userId')
  @Permissions('FARM_MEMBER_UPDATE_ROLE')
  async updateFarmMemberRole(
    @Request() req,
    @Param('userId') userId: string,
    @Body() { roleId }: { roleId: string }
  ) {
    const requesterId = req.user.id; // get the current user ID
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id']);
    if (!selectedFarmId) {
      throw new HttpException('Selected farm ID is required.', HttpStatus.BAD_REQUEST);
    }

    return this.farmMembersService.updateFarmMemberRole(selectedFarmId, parseInt(userId), parseInt(roleId), requesterId);
  }
}