import { IsNotEmpty, IsNumber, IsString, IsObject } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  typeId: number;

  @IsNumber()
  ownerId: number;
}