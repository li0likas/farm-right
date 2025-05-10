import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { Equipment } from '@prisma/client';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@ApiTags('equipment')
@ApiBearerAuth()
@Controller('equipment')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @Permissions('EQUIPMENT_READ')
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiResponse({ status: 200, description: 'All equipment retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllEquipment(@Request() req) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(selectedFarmId)) {
      throw new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST);
    }
    return this.equipmentService.getAllEquipment(selectedFarmId);
  }

  @Get(':id')
  @Permissions('EQUIPMENT_READ')
  @ApiOperation({ summary: 'Get equipment by id' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getEquipmentById(@Param('id') id: number, @Request() req) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(selectedFarmId)) {
      throw new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST);
    }
    return this.equipmentService.getEquipmentById(id, selectedFarmId);
  }

  @Post()
  @Permissions('EQUIPMENT_CREATE')
  @ApiOperation({ summary: 'Create a new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createEquipment(@Request() req): Promise<Equipment> {
    const ownerId = req.user.id;
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(selectedFarmId)) {
      throw new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST);
    }

    const { name, description, typeId } = req.body;
    const createEquipmentDto: CreateEquipmentDto = {
      name,
      description,
      typeId,
      ownerId: parseInt(ownerId),
      farmId: selectedFarmId,
    };

    return this.equipmentService.createEquipment(createEquipmentDto);
  }

  @Put(':id')
  @Permissions('EQUIPMENT_UPDATE')
  @ApiOperation({ summary: 'Update an equipment' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateEquipment(
    @Param('id') id: string,
    @Body() data: { name?: string; typeId?: number; ownerId?: number; description?: string },
    @Request() req
  ) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(selectedFarmId)) {
      throw new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST);
    }

    return this.equipmentService.updateEquipment(parseInt(id), data, selectedFarmId);
  }

  @Delete(':id')
  @Permissions('EQUIPMENT_DELETE')
  @ApiOperation({ summary: 'Delete an equipment' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteEquipment(@Param('id') id: string, @Request() req) {
    const selectedFarmId = parseInt(req.headers['x-selected-farm-id'], 10);
    if (isNaN(selectedFarmId)) {
      throw new HttpException('Invalid farm ID', HttpStatus.BAD_REQUEST);
    }
    return this.equipmentService.deleteEquipment(parseInt(id), selectedFarmId);
  }
}