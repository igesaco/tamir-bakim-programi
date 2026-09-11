import { IsInt, Max, Min } from 'class-validator';

export class UpdateCustomerMileageDto {
  @IsInt()
  @Min(0)
  @Max(9999999)
  mileage: number;
}
