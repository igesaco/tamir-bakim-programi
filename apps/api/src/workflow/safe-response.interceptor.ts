import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';
import { mediaLink } from '../media/media-links';

export function safeResponse(value: any, user?: any): any {
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map(item => safeResponse(item, user));
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return value;
  const result: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (['passwordHash', 'otpHash', 'tokenHash', 'requestHash'].includes(key)) continue;
    if (user?.customerId && key === 'internalNote') continue;
    result[key] = safeResponse(child, user);
  }
  if (user?.organizationId && value.id && value.storageKey && value.fileName) {
    result.storageKey = mediaLink(value.id, user);
  }
  return result;
}
@Injectable()
export class SafeResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const user = context.switchToHttp().getRequest().user;
    return next.handle().pipe(map(value => safeResponse(value, user)));
  }
}
