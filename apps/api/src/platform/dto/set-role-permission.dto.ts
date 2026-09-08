import {
  IsBoolean,
} from 'class-validator';

export class SetRolePermissionDto {
  @IsBoolean()
  allowed: boolean;
}
