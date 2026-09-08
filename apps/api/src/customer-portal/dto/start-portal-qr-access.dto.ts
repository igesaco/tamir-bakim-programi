import {
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class StartPortalQrAccessDto {
  @IsString()
  @Length(11, 11)
  nationalId: string;

  @IsString()
  @MinLength(10)
  qrToken: string;
}
