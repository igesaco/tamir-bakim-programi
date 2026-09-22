import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DiagnoseDto {
  @IsString()
  @IsNotEmpty({ message: 'Müşteri şikayeti boş olamaz.' })
  complaint: string;

  @IsString()
  @IsOptional()
  vehicleBrand?: string;

  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @IsNumber()
  @IsOptional()
  vehicleYear?: number;

  @IsString()
  @IsOptional()
  vehicleFuel?: string;

  @IsNumber()
  @IsOptional()
  mileage?: number;
}
