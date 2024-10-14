import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { FieldService } from './field.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { Field } from '@prisma/client';

@Controller('fields')
export class FieldController {
  constructor(private readonly fieldsService: FieldService) {}

  @Post()
  async create(@Body() createFieldDto: CreateFieldDto): Promise<Field> {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  async findAll(): Promise<Field[]> {
    return this.fieldsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Field> {
    return this.fieldsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() field: Partial<Field>): Promise<Field> {
    return this.fieldsService.update(id, field);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<Field> {
    return this.fieldsService.delete(id);
  }
}
