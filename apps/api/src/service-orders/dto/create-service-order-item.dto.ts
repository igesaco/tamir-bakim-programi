import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServiceItemType } from '@prisma/client';

export class CreateServiceOrderItemDto {
  @IsEnum(ServiceItemType)
  type: ServiceItemType;

  @IsOptional()
  @IsString()
  partId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}
