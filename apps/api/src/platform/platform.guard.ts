import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class PlatformGuard
  implements CanActivate
{
  canActivate(
    context: ExecutionContext,
  ) {
    const request =
      context
        .switchToHttp()
        .getRequest();

    if (
      request.user?.actorType !==
      'PLATFORM'
    ) {
      throw new ForbiddenException(
        'Platform yönetim yetkisi gerekli.',
      );
    }

    return true;
  }
}
