import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MediaType } from '@prisma/client';

export class UploadMediaDto {
  @IsEnum(MediaType)
  type: MediaType;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsOptional()
  @IsString()
  inspectionId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
