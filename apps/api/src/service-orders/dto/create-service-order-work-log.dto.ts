import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  ServiceOrderWorkLogType,
} from '@prisma/client';

export class CreateServiceOrderWorkLogDto {
  @IsEnum(
    ServiceOrderWorkLogType,
  )
  type:
    ServiceOrderWorkLogType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  note?: string;

  @IsOptional()
  @IsString()
  partId?: string;

  @IsOptional()
  @IsString()
  partName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  quantity?: number;
}
