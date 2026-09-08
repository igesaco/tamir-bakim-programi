import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateOrganizationCommercialDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

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
  @MaxLength(2000)
  platformNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  monthlyFee?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
