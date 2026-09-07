import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceOrderDto {
  @IsString()
  customerId: string;

  @IsString()
  vehicleId: string;

  @IsInt()
  @Min(0)
  mileage: number;

  @IsOptional()
  @IsString()
  complaint?: string;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsOptional()
  @IsString()
  assignedTechnicianId?: string;
}
