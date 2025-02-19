import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { EquipmentTypeOptionsService } from './equipmentTypeOptions.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('equipment-type-options')
@ApiBearerAuth()
@Controller('equipment-type-options')
@UseGuards(AuthGuard('jwt'))
export class EquipmentTypeOptionsController {
  constructor(private readonly equipmentTypeOptionsService: EquipmentTypeOptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all equipment type options' })
  @ApiResponse({ status: 200, description: 'All equipment type options retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllEquipmentTypeOptions() {
    return this.equipmentTypeOptionsService.getAllEquipmentTypeOptions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment type option by id' })
  @ApiResponse({ status: 200, description: 'Equipment type option retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment type option not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getEquipmentTypeOptionById(@Param('id') id: number) {
    return this.equipmentTypeOptionsService.getEquipmentTypeOptionById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new equipment type option' })
  @ApiResponse({ status: 201, description: 'Equipment type option created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createEquipmentTypeOption(@Body('name') name: string) {
    return this.equipmentTypeOptionsService.createEquipmentTypeOption(name);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an equipment type option' })
  @ApiResponse({ status: 200, description: 'Equipment type option updated successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment type option not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateEquipmentTypeOption(@Param('id') id: number, @Body('name') name: string) {
    return this.equipmentTypeOptionsService.updateEquipmentTypeOption(id, name);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an equipment type option' })
  @ApiResponse({ status: 200, description: 'Equipment type option deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment type option not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteEquipmentTypeOption(@Param('id') id: number) {
    return this.equipmentTypeOptionsService.deleteEquipmentTypeOption(id);
  }
}