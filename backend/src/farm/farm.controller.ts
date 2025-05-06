import { Controller, Get, Param, Patch, Delete, Body, UseGuards, Request, Post } from '@nestjs/common';
import { FarmService } from './farm.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('farms')
export class FarmController {
  constructor(private readonly farmService: FarmService) {}

  @Post()
  async createFarm(@Request() req, @Body() body: { name: string }) {
    return this.farmService.createFarm(req.user, body.name);
  }

  @Get(':id')
  async getFarmDetails(@Param('id') id: string) {
    return this.farmService.getFarmDetails(parseInt(id, 10));
  }

  @Patch(':id')
  async renameFarm(@Param('id') id: string, @Body() body: { name: string }, @Request() req) {
    return this.farmService.renameFarm(parseInt(id, 10), body.name, req.user.id);
  }

  @Delete(':id')
  async deleteFarm(@Param('id') id: string, @Request() req) {
    return this.farmService.deleteFarm(parseInt(id, 10), req.user.id);
  }

  @Delete('leave/:farmId')
  async leaveFarm(@Param('farmId') farmId: string, @Request() req) {
    return this.farmService.leaveFarm(req.user.id, parseInt(farmId));
  }
}
