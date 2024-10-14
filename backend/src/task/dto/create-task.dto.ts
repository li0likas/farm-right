import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description?: string;

  @IsString()
  status?: string; // You may want to use an enum instead of string

  @IsNumber()
  fieldId: number; // This will be used to associate the Task with a Field
}
