import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class CheckWhatsappAccessDto {
  @IsString()
  challengeId: string;

  @IsOptional()
  @IsIn(['WEB', 'MOBILE'])
  client?: 'WEB' | 'MOBILE';
}
