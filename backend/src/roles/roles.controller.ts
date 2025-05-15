import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('PERMISSION_READ', 'FARM_MEMBER_UPDATE_ROLE')
  async getAllRoles(@Request() req) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(selectedFarmId)) {
      throw new HttpException('Invalid selected farm ID', HttpStatus.BAD_REQUEST);
    }
    return this.rolesService.getAllRoles(selectedFarmId);
  }

  @Get('permissions')
  @Permissions('PERMISSION_READ')
  async getAllPermissions(@Request() req) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(selectedFarmId)) {
      throw new HttpException('Invalid selected farm ID', HttpStatus.BAD_REQUEST);
    }
    return this.rolesService.getAllPermissions(selectedFarmId);
  }

  @Post(':roleId/permissions')
  @Permissions('PERMISSION_ASSIGN')
  async assignPermission(
    @Param('roleId') roleId: string,
    @Body() body: { permissionId: string; farmId: string },
    @Request() req
  ) {
    const parsedRoleId = parseInt(roleId, 10);
    const parsedPermissionId = parseInt(body.permissionId, 10);
    const parsedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);

    if (isNaN(parsedRoleId) || isNaN(parsedPermissionId) || isNaN(parsedFarmId)) {
      throw new HttpException('Invalid roleId, permissionId, or farmId', HttpStatus.BAD_REQUEST);
    }

    return this.rolesService.assignPermission(parsedRoleId, parsedPermissionId, parsedFarmId);
  }

  @Delete(':roleId/permissions/:permissionId')
  @Permissions('PERMISSION_REMOVE')
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @Request() req
  ) {
    const parsedRoleId = parseInt(roleId, 10);
    const parsedPermissionId = parseInt(permissionId, 10);
    const parsedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);

    if (isNaN(parsedRoleId) || isNaN(parsedPermissionId) || isNaN(parsedFarmId)) {
      throw new HttpException('Invalid roleId, permissionId, or farmId', HttpStatus.BAD_REQUEST);
    }

    return this.rolesService.removePermission(parsedRoleId, parsedPermissionId, parsedFarmId);
  }
}