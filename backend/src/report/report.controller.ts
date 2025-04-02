import { Controller, Get, UseGuards, Request, ForbiddenException, BadRequestException, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportsService: ReportService) {}

  @Get('tasks')
  @Permissions('TASK_STATS_READ')
  async getTaskReport(@Request() req) {
    const farmId = parseInt(req.headers['x-selected-farm-id']);
    const seasonId = parseInt(req.headers['seasonid']);
  
    if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection');
    if (isNaN(seasonId)) throw new BadRequestException('Season ID is required');
  
    return this.reportsService.getTaskReport(farmId, seasonId);
  }  

    @Get('equipment-usage')
    @Permissions('TASK_READ')
    async getEquipmentUsageReport(@Request() req) {
      const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
      const seasonId = parseInt(req.headers['seasonid'], 10);
    
      if (!farmId || !seasonId) {
        throw new BadRequestException("Missing farm or season ID in headers");
      }
    
      return this.reportsService.getEquipmentUsageReport(farmId, seasonId);
    }

    @Get('farm-members-activity')
    @Permissions('TASK_STATS_READ')
    async getFarmMemberActivity(@Request() req) {
    const farmId = parseInt(req.headers['x-selected-farm-id']);
    const seasonId = parseInt(req.headers['seasonid']);

    if (isNaN(farmId) || isNaN(seasonId)) {
        throw new BadRequestException('Missing or invalid farm/season ID');
    }

    return this.reportsService.getFarmMemberActivityReport(farmId, seasonId);
    }
}
