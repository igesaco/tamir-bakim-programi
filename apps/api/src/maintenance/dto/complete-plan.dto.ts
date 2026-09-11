import { IsDateString, IsInt, Min } from 'class-validator';
export class CompletePlanDto {
  @IsInt() @Min(0) mileage: number;
  @IsDateString() performedAt: string;
}
