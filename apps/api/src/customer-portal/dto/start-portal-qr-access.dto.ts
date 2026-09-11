import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class StartPortalQrAccessDto {
  @IsString()
  @MinLength(10)
  phone: string;

  @IsString()
  @MinLength(10)
  qrToken: string;

  @IsOptional()
  @IsIn(['SMS', 'WHATSAPP'])
  channel?: 'SMS' | 'WHATSAPP';
}
