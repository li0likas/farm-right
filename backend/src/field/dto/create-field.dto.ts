import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFieldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  area: number;

  @IsNumber()
  @IsNotEmpty()
  perimeter: number;

  @IsNumber()
  @IsNotEmpty()
  cropId: number;

  @IsNumber()
  ownerId: number;
}