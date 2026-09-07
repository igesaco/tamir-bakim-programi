import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  customerId: string;

  @IsString()
  vehicleId: string;

  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}
