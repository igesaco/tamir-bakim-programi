const labels = {
  REQUESTED: 'Talep Edildi',
  CONFIRMED: 'Onaylandı',
  CANCELLED: 'İptal Edildi',
  COMPLETED: 'Tamamlandı',

  ARRIVED: 'Araç Geldi',
  ACCEPTED: 'Kabul Edildi',
  INSPECTION: 'Kontrol Ediliyor',
  QUOTE_WAITING: 'Teklif Bekliyor',
  APPROVED: 'Onaylandı',
  IN_PROGRESS: 'İşlemde',
  PART_WAITING: 'Parça Bekliyor',
  QUALITY_CONTROL: 'Kalite Kontrol',
  READY: 'Teslime Hazır',
  PAYMENT_WAITING: 'Ödeme Bekliyor',
  DELIVERED: 'Teslim Edildi',

  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  REJECTED: 'Reddedildi',
  EXPIRED: 'Süresi Doldu',

  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',

  PAID: 'Ödendi',
  PENDING: 'Bekliyor',
  FAILED: 'Başarısız',

  READ: 'Okundu',
  UNREAD: 'Okunmadı',

  LABOR: 'İşçilik',
  PART: 'Parça',
  OTHER: 'Diğer',
};

export function statusLabel(value) {
  return labels[value] || value || '-';
}
