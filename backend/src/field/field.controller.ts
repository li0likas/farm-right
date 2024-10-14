import { Controller, Post, Body, Get, Param, Put, Delete, NotFoundException } from '@nestjs/common';
import { FieldService } from './field.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { FieldResponseDto } from './dto/field-response.dto';
import { Field } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('fields')
@Controller('fields')
export class FieldController {
  constructor(private readonly fieldsService: FieldService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new field' })
  @ApiResponse({ status: 201, description: 'The field has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createFieldDto: CreateFieldDto): Promise<Field> {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all fields' })
  @ApiResponse({ status: 200, description: 'The fields have been successfully retrieved.', type: [FieldResponseDto] })
  async findAll(): Promise<Field[]> {
    return this.fieldsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully retrieved.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async findOne(@Param('id') id: string): Promise<FieldResponseDto> {
    const field = await this.fieldsService.findOne(parseInt(id));
    if (!field) {
      throw new NotFoundException(`Field with id ${id} not found`);
    }
    return field;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully updated.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async update(@Param('id') id: string, @Body() field: Partial<Field>): Promise<Field> {
    return this.fieldsService.update(parseInt(id), field);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a field by id' })
  @ApiResponse({ status: 200, description: 'The field has been successfully deleted.', type: FieldResponseDto })
  @ApiResponse({ status: 404, description: 'Field not found.' })
  async delete(@Param('id') id: string): Promise<FieldResponseDto> {
    const deletedField = await this.fieldsService.delete(parseInt(id));
    if (deletedField == null) {
      throw new NotFoundException(`Field with id ${id} not found`);
    }
    return deletedField;
  }  
}
