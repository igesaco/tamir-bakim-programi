import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '@prisma/client';

export const PERMISSION_KEY =
  'required_permission';

export const Permission = (
  permission: PermissionKey,
) =>
  SetMetadata(
    PERMISSION_KEY,
    permission,
  );
