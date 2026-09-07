import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<
        UserRole[]
      >(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      ) ?? [];

    if (!requiredRoles.length) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest();

    const rawRole =
      request.user?.role;

    if (!rawRole) {
      throw new ForbiddenException(
        'Yetkiniz bulunmuyor.',
      );
    }

    const userRole =
      String(rawRole)
        .trim()
        .toUpperCase();

    const allowed =
      requiredRoles.some(
        (role) =>
          String(role)
            .trim()
            .toUpperCase() ===
          userRole,
      );

    if (!allowed) {
      throw new ForbiddenException(
        'Bu işlem için yetkiniz bulunmuyor.',
      );
    }

    return true;
  }
}
