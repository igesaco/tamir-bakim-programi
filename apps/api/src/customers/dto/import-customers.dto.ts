import { Type } from 'class-transformer';
import {
  IsArray, IsEmail, IsInt, IsOptional, IsString, Max, Min,
  MinLength, ValidateNested,
} from 'class-validator';

export class ImportCustomerRowDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() branchId?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() plate?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsInt() @Min(1900) @Max(2100) modelYear?: number;
  @IsOptional() @IsInt() @Min(0) mileage?: number;
}

export class ImportCustomersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportCustomerRowDto)
  rows: ImportCustomerRowDto[];
}
