import {
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInspectionItemDto {
  @IsString()
  category: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  recommendedAction?: string;
}
