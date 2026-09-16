import { IsOptional, IsString, MinLength } from 'class-validator';

export class StartWorkSessionDto {
  @IsOptional()
  @IsString()
  serviceOrderItemId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  note?: string;
}
