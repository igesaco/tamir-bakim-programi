import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationChannel } from '@prisma/client';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  title: string;

  @IsString()
  message: string;
}
