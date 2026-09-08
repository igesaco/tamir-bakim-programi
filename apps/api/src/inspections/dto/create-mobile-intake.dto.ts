import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  Type,
} from 'class-transformer';
import {
  ServiceItemType,
} from '@prisma/client';

export class MobileIntakeItemDto {
  @IsEnum(ServiceItemType)
  type: ServiceItemType;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
}

export class CreateMobileIntakeDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  customerFirstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  customerLastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  customerEmail?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  plate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  modelYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  vin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  fuelType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  transmission?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @IsInt()
  @Min(0)
  mileage: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  fuelLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerComplaint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  existingDamage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  valuablesNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      MobileIntakeItemDto,
  )
  plannedItems?: MobileIntakeItemDto[];
}
