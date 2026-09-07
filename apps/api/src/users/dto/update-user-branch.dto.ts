import { IsOptional, IsString } from 'class-validator';

export class UpdateUserBranchDto {
  @IsOptional()
  @IsString()
  branchId?: string;
}
