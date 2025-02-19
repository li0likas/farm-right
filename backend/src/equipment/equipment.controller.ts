import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { Equipment } from '@prisma/client';

@ApiTags('equipment')
@ApiBearerAuth()
@Controller('equipment')
@UseGuards(AuthGuard('jwt'))
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiResponse({ status: 200, description: 'All equipment retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getAllEquipment() {
    return this.equipmentService.getAllEquipment();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by id' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getEquipmentById(@Param('id') id: number) {
    return this.equipmentService.getEquipmentById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createEquipment(@Request() req): Promise<Equipment> {
    const ownerId = req.user.id;
    const {name, description, typeId } = req.body;

    const createEquipmentDto: CreateEquipmentDto = {
      name, description, typeId, ownerId: parseInt(ownerId)
    };

    return this.equipmentService.createEquipment(createEquipmentDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an equipment' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateEquipment(@Param('id') id: number, @Body() data: { name?: string; typeId?: number; ownerId?: number; description?: string }) {
    return this.equipmentService.updateEquipment(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an equipment' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteEquipment(@Param('id') id: number) {
    return this.equipmentService.deleteEquipment(id);
  }
}