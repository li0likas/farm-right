import { IsNumber, IsDate, IsString, IsOptional } from 'class-validator';

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
}
