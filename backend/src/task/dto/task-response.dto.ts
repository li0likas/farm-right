import { IsNumber, IsString, IsNotEmpty, IsDate } from 'class-validator';

export class TaskResponseDto {
    @IsNotEmpty()
    @IsString()
    title: string;
  
    @IsString()
    description?: string;
  
    @IsString()
    status?: string; // You may want to use an enum instead of string
}
