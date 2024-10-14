import { IsNumber, IsString, IsDate } from 'class-validator';

export class FieldResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  size: number;

  @IsString()
  location: string;

  @IsString()
  crop: string;
}
