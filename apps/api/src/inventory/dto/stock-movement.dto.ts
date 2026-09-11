import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class StockMovementDto {
  @IsOptional()
  @IsString()
  serviceOrderItemId?: string;

  @IsString()
  partId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
