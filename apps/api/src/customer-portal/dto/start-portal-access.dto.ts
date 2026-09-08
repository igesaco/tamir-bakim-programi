import {
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class StartPortalAccessDto {
  @IsString()
  @Length(11, 11)
  nationalId: string;

  @IsString()
  @MinLength(5)
  plate: string;
}
