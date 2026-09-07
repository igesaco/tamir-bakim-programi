import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  customerId: string;

  @IsString()
  @MinLength(2)
  plate: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsString()
  @MinLength(2)
  brand: string;

  @IsString()
  @MinLength(1)
  model: string;

  @IsOptional()
  @IsInt()
  modelYear?: number;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}