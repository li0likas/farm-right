import { IsNumber, IsString, IsDate } from 'class-validator';

export class FieldResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  area: number;

  @IsNumber()
  perimeter: number;

  @IsNumber()
  cropId: number;
}
