import {
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
}
