import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateInspectionDto {
  @IsString()
  vehicleId: string;

  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsInt()
  @Min(0)
  mileage: number;

  @IsOptional()
  @IsString()
  fuelLevel?: string;

  @IsOptional()
  @IsString()
  customerComplaint?: string;

  @IsOptional()
  @IsString()
  existingDamage?: string;

  @IsOptional()
  @IsString()
  valuablesNote?: string;
}
