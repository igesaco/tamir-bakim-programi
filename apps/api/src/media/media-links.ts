import { createHmac, timingSafeEqual } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

type MediaClaim = { id: string; org: string; user?: string; customer?: string; role?: string; version?: number; exp: number };
function sign(body: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required for media access.');
  return createHmac('sha256', secret).update(`media-v1:${body}`).digest('base64url');
}
export function mediaLink(id: string, user: any) {
  const claim: MediaClaim = { id, org: user.organizationId, user: user.sub,
    customer: user.customerId, role: user.role, version: user.tokenVersion,
    exp: Math.floor(Date.now() / 1000) + 600 };
  const body = Buffer.from(JSON.stringify(claim)).toString('base64url');
  return `media/content/${encodeURIComponent(id)}?access=${body}.${sign(body)}`;
}
export function verifyMediaLink(id: string, token: string): MediaClaim {
  try {
    const [body, signature, extra] = token.split('.');
    const expected = Buffer.from(sign(body));
    const actual = Buffer.from(signature || '');
    if (extra || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
    const claim: MediaClaim = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (claim.id !== id || !claim.org || claim.exp <= Date.now() / 1000) throw new Error();
    return claim;
  } catch { throw new UnauthorizedException('Dosya bağlantısı geçersiz veya süresi doldu. Ekranı yenileyin.'); }
}
