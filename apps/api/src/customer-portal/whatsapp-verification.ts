import {
  createHmac,
  timingSafeEqual,
} from 'crypto';

export function extractWhatsappCode(
  message: string,
) {
  return message
    .match(/\bTB-(\d{6})\b/i)?.[1] ||
    '';
}

export function validWhatsappSignature(
  rawBody: Buffer | undefined,
  signature: string | undefined,
  appSecret: string,
) {
  if (
    !rawBody ||
    !signature?.startsWith('sha256=') ||
    !appSecret
  ) {
    return false;
  }

  const expected = Buffer.from(
    `sha256=${createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`,
  );
  const received = Buffer.from(signature);

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}
