import {
  ArrayUnique,
  IsArray,
  IsEnum,
} from 'class-validator';
import { PermissionKey } from '@prisma/client';

export class ReplaceRolePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(
    PermissionKey,
    {
      each: true,
    },
  )
  permissions:
    PermissionKey[];
}
