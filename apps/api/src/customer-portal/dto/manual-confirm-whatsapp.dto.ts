import {
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class ManualConfirmWhatsappDto {
  @IsString()
  @Matches(/^(?:TB-)?\d{6}$/i, {
    message:
      'WhatsApp kodu TB-123456 veya 123456 biçiminde olmalıdır.',
  })
  code: string;

  @IsString()
  @MinLength(10)
  senderPhone: string;
}
