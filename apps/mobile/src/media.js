import {
  API_URL,
} from './api/client';

export function mediaUrl(
  media,
) {
  const key =
    typeof media ===
      'string'
      ? media
      : media?.storageKey;

  if (!key) {
    return '';
  }

  if (
    /^https?:\/\//i.test(
      key,
    )
  ) {
    return key;
  }

  return (
    `${API_URL}/` +
    key.replace(
      /^\/+/, 
      '',
    )
  );
}

export function photoLabel(
  type,
) {
  const labels = {
    VEHICLE: 'Araç',
    ACCEPTANCE: 'Kabul',
    DAMAGE: 'Hasar',
    ENGINE: 'Motor',
    PART: 'Parça',
    BEFORE: 'Öncesi',
    AFTER: 'Sonrası',
    ODOMETER: 'Kilometre',
    DOCUMENT: 'Belge',
    INVOICE: 'Fatura',
    OTHER: 'Diğer',
  };

  return (
    labels[type] ||
    type ||
    'Fotoğraf'
  );
}
