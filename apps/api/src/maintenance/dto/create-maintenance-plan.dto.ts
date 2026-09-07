import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMaintenancePlanDto {
  @IsString()
  vehicleId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  nextDueKm?: number;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedPriceMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedPriceMax?: number;
}
