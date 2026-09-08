import {
  Injectable,
} from '@nestjs/common';
import {
  PermissionKey,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  defaultPermissionsForRole,
} from './default-role-permissions';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getEffectivePermissions(
    organizationId: string,
    role: UserRole,
  ) {
    const permissions =
      new Set<PermissionKey>(
        defaultPermissionsForRole(
          role,
        ),
      );

    const overrides =
      await this.prisma.organizationRolePermissionOverride.findMany({
        where: {
          organizationId,
          role,
        },
      });

    for (
      const override of
        overrides
    ) {
      if (
        override.allowed
      ) {
        permissions.add(
          override.permission,
        );
      } else {
        permissions.delete(
          override.permission,
        );
      }
    }

    return Array.from(
      permissions,
    );
  }

  async getRolePermissionMatrix(
    organizationId: string,
  ) {
    const roles =
      Object.values(
        UserRole,
      );

    const overrides =
      await this.prisma.organizationRolePermissionOverride.findMany({
        where: {
          organizationId,
        },
        orderBy: [
          {
            role: 'asc',
          },
          {
            permission:
              'asc',
          },
        ],
      });

    const result:
      Record<
        string,
        {
          effective:
            PermissionKey[];
          defaults:
            PermissionKey[];
          overrides: typeof overrides;
        }
      > = {};

    for (
      const role of roles
    ) {
      result[role] = {
        effective:
          await this.getEffectivePermissions(
            organizationId,
            role,
          ),
        defaults:
          defaultPermissionsForRole(
            role,
          ),
        overrides:
          overrides.filter(
            (item) =>
              item.role ===
              role,
          ),
      };
    }

    return result;
  }
}
