import {
  BadRequestException,
} from '@nestjs/common';
import {
  createHmac,
} from 'crypto';

export function normalizeNationalId(
  value: string,
) {
  return value.replace(
    /\D/g,
    '',
  );
}

export function validateTurkishNationalId(
  value: string,
) {
  const id =
    normalizeNationalId(value);

  if (
    !/^\d{11}$/.test(id) ||
    id[0] === '0'
  ) {
    return false;
  }

  const digits =
    id
      .split('')
      .map(Number);

  const oddSum =
    digits[0] +
    digits[2] +
    digits[4] +
    digits[6] +
    digits[8];

  const evenSum =
    digits[1] +
    digits[3] +
    digits[5] +
    digits[7];

  const digit10 =
    ((oddSum * 7 -
      evenSum) %
      10 +
      10) %
    10;

  const digit11 =
    digits
      .slice(0, 10)
      .reduce(
        (sum, digit) =>
          sum + digit,
        0,
      ) % 10;

  return (
    digit10 === digits[9] &&
    digit11 === digits[10]
  );
}

export function nationalIdFingerprint(
  value: string,
) {
  const normalized =
    normalizeNationalId(value);

  if (
    !validateTurkishNationalId(
      normalized,
    )
  ) {
    throw new BadRequestException(
      'T.C. kimlik numarası geçerli değil.',
    );
  }

  const pepper =
    process.env.CUSTOMER_ID_PEPPER ||
    process.env.JWT_SECRET;

  if (!pepper) {
    throw new Error(
      'CUSTOMER_ID_PEPPER or JWT_SECRET is required.',
    );
  }

  return {
    hash:
      createHmac(
        'sha256',
        pepper,
      )
        .update(normalized)
        .digest('hex'),
    last4:
      normalized.slice(-4),
  };
}
