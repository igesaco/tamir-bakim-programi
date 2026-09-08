import {
  IsString,
  Length,
} from 'class-validator';

export class VerifyPortalAccessDto {
  @IsString()
  challengeId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
