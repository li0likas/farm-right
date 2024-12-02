import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class TaskResponseDto {
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
}