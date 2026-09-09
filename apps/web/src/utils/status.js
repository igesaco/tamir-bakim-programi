const labels = {
  REQUESTED: 'Talep Edildi',
  CONFIRMED: 'Onaylandı',
  RESCHEDULED: 'Yeniden Planlandı',
  NO_SHOW: 'Gelmedi',
  CANCELLED: 'İptal Edildi',
  COMPLETED: 'Tamamlandı',

  APPOINTMENT: 'Randevu',
  ARRIVED: 'Araç Geldi',
  ACCEPTED: 'Araç Kabul Edildi',
  INSPECTION: 'Teknik İnceleme',
  QUOTE_WAITING: 'Fiyatlandırma Bekleniyor',
  APPROVED: 'İş Emri Onaylandı',
  IN_PROGRESS: 'Servis İşlemi Başladı',
  PART_WAITING: 'Parça Bekleniyor',
  QUALITY_CONTROL: 'Kalite Kontrol / Son Kontrol',
  READY: 'Teslimata Hazır',
  PAYMENT_WAITING: 'Ödeme Bekliyor',
  DELIVERED: 'Teslim Edildi',

  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  PARTIALLY_APPROVED: 'Kısmen Onaylandı',
  REJECTED: 'Reddedildi',
  EXPIRED: 'Süresi Doldu',

  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',

  PAID: 'Ödendi',
  PARTIAL: 'Kısmi Ödeme',
  PENDING: 'Bekliyor',
  REFUNDED: 'İade Edildi',
  FAILED: 'Başarısız',

  READ: 'Okundu',
  UNREAD: 'Okunmadı',

  LABOR: 'İşçilik',
  PART: 'Parça',
  OTHER: 'Diğer',

  ACCEPTANCE: 'Araç Kabul',
  DAMAGE: 'Hasar',
  ENGINE: 'Motor',
  BEFORE: 'İşlem Öncesi',
  AFTER: 'İşlem Sonrası',
  ODOMETER: 'Kilometre',
  DOCUMENT: 'Belge',
  INVOICE: 'Fatura',
  VEHICLE: 'Araç',

  GOOD: 'İyi',
  ATTENTION: 'Kontrol Gerekli',
  BAD: 'Değişim Gerekli',
};

export function statusLabel(value) {
  return labels[value] || value || '-';
}
