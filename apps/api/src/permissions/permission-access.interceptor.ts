import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionKey } from '@prisma/client';
import { Observable } from 'rxjs';

import {
  PERMISSION_KEY,
} from './permission.decorator';

@Injectable()
export class PermissionAccessInterceptor
  implements NestInterceptor
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const requiredPermission =
      this.reflector.getAllAndOverride<
        PermissionKey | undefined
      >(
        PERMISSION_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !requiredPermission
    ) {
      return next.handle();
    }

    const request =
      context
        .switchToHttp()
        .getRequest();

    const user =
      request.user;

    if (!user) {
      return next.handle();
    }

    if (
      user.actorType ===
        'PLATFORM' ||
      user.actorType ===
        'TENANT_IMPERSONATION'
    ) {
      return next.handle();
    }

    const permissions =
      Array.isArray(
        user.permissions,
      )
        ? user.permissions
        : [];

    if (
      !permissions.includes(
        requiredPermission,
      )
    ) {
      throw new ForbiddenException(
        'Bu işlem için detay yetkiniz bulunmuyor.',
      );
    }

    return next.handle();
  }
}
