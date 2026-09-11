import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class StartPortalPhoneAccessDto {
  @IsString()
  @MinLength(10)
  phone: string;

  @IsOptional()
  @IsIn(['SMS', 'WHATSAPP'])
  channel?: 'SMS' | 'WHATSAPP';
}
