import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const method = req.method;
    const user = req.user;

    if (
      !user?.organizationId ||
      !['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        const pathParts = req.path
          .split('/')
          .filter(Boolean);

        const entityType =
          pathParts[0] ?? 'unknown';

        const entityId =
          result?.id ??
          req.params?.id ??
          'unknown';

        const safeBody = {
          ...req.body,
        };

        delete safeBody.password;
        delete safeBody.passwordHash;

        void this.auditService
          .create({
            organizationId:
              user.organizationId,
            branchId:
              user.branchId ?? null,
            userId:
              user.sub ?? null,
            action: method,
            entityType,
            entityId,
            newData: safeBody,
            ipAddress: req.ip,
          })
          .catch(() => undefined);
      }),
    );
  }
}
