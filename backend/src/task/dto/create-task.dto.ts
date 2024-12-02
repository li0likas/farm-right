import { IsNumber, IsDate, IsString, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsNumber()
  typeId: number;

  @IsString()
  description?: string;

  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsDate()
  completionDate?: Date;

  @IsOptional()
  @IsString()
  status: string;

  @IsNumber()
  fieldId: number;
}
