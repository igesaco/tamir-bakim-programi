import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOrganizationCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organizationName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  ownerFirstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  ownerLastName: string;

  @IsEmail()
  @MaxLength(160)
  ownerEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ownerPhone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  ownerPassword: string;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPersonName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPersonPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappPhone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  monthlyFee?: number;
}
