import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FarmMembersService } from './farm-members.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('farm-members')
@UseGuards(AuthGuard('jwt'))
export class FarmMembersController {
  constructor(private readonly farmMembersService: FarmMembersService) {}

  @Get(':farmId')
  async getFarmMembers(@Param('farmId') farmId: string) {
    return this.farmMembersService.getFarmMembers(parseInt(farmId));
  }

  @Post()
  async addFarmMember(
    @Body() { farmId, userId, roleId }: { farmId: string; userId: string; roleId: string }
  ) {
    return this.farmMembersService.addFarmMember(parseInt(farmId), parseInt(userId), parseInt(roleId));
  }

  @Delete(':farmId/:userId')
  async removeFarmMember(@Param('farmId') farmId: string, @Param('userId') userId: string) {
    return this.farmMembersService.removeFarmMember(parseInt(farmId), parseInt(userId));
  }

  @Patch(':farmId/:userId')
  async updateFarmMemberRole(
    @Param('farmId') farmId: string,
    @Param('userId') userId: string,
    @Body() { roleId }: { roleId: string }
  ) {
    return this.farmMembersService.updateFarmMemberRole(parseInt(farmId), parseInt(userId), parseInt(roleId));
  }
}
