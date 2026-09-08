import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureKey } from '@prisma/client';
import {
  Observable,
} from 'rxjs';

import {
  FEATURE_KEY,
} from './feature.decorator';

@Injectable()
export class FeatureAccessInterceptor
  implements NestInterceptor
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const requiredFeature =
      this.reflector.getAllAndOverride<
        FeatureKey | undefined
      >(
        FEATURE_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (!requiredFeature) {
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
      'PLATFORM'
    ) {
      return next.handle();
    }

    const features =
      Array.isArray(
        user.features,
      )
        ? user.features
        : [];

    if (
      !features.includes(
        requiredFeature,
      )
    ) {
      throw new ForbiddenException(
        'Bu modül mevcut paketinizde aktif değil.',
      );
    }

    return next.handle();
  }
}
