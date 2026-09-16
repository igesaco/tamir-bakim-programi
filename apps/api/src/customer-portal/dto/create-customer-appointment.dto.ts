import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCustomerAppointmentDto {
  @IsDateString()
  startAt: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(720)
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}
