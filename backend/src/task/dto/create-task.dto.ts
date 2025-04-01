import { IsNumber, IsDate, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateTaskDto {
  @IsNumber()
  typeId: number;

  @IsString()
  description?: string;

  @IsOptional()
  dueDate?: Date;

  @IsOptional()
  completionDate?: Date;

  @IsNumber()
  statusId: number;

  @IsNumber()
  fieldId: number;

  @IsNumber()
  seasonId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  equipmentIds?: number[];
}
