import {
  IsString,
  MinLength,
} from 'class-validator';

export class StartPortalPhoneAccessDto {
  @IsString()
  @MinLength(10)
  phone: string;
}
