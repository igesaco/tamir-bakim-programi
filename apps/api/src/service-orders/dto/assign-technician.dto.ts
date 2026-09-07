import { IsOptional, IsString } from '@nestjs/class-validator';

export class AssignTechnicianDto {
  @IsOptional()
  @IsString()
  technicianId?: string | null;
}
