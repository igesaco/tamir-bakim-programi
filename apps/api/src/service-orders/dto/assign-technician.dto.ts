import {
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignTechnicianDto {
  @IsOptional()
  @IsString()
  technicianId?: string | null;
}
