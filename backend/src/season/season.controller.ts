import {Controller, Get, Request, UseGuards, ForbiddenException} from '@nestjs/common';
import { SeasonService } from './season.service';
import { Permissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('seasons')
export class SeasonController {
constructor(private readonly seasonService: SeasonService) {}

    @Get()
    @Permissions('TASK_CREATE') // or your preferred permission
    async getSeasonsForSelectedFarm(@Request() req) {
        const farmId = parseInt(req.headers['x-selected-farm-id'], 10);
        if (isNaN(farmId)) throw new ForbiddenException('Invalid farm selection.');

        return this.seasonService.findByFarm(farmId);
    }
}
