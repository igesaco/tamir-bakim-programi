import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProcurementRequestStatus } from '@prisma/client';

export class UpdateProcurementRequestDto {
  @IsEnum(ProcurementRequestStatus)
  status: ProcurementRequestStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
