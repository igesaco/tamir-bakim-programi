import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PlatformLedgerType } from '@prisma/client';

export class CreatePlatformLedgerEntryDto {
  @IsEnum(PlatformLedgerType)
  type: PlatformLedgerType;

  @IsNumber()
  @Min(0.01)
  @Max(100000000)
  amount: number;

  @IsString()
  @MaxLength(300)
  description: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
