const labels = {
  REQUESTED: 'Talep Edildi',
  CONFIRMED: 'Onaylandı',
  RESCHEDULED: 'Yeniden Planlandı',
  NO_SHOW: 'Gelmedi',
  CANCELLED: 'İptal Edildi',
  COMPLETED: 'Tamamlandı',

  APPOINTMENT: 'Randevu',
  ARRIVED: 'Araç Geldi',
  ACCEPTED: 'Bakım Sırası Bekliyor',
  INSPECTION: 'Kontrol Ediliyor',
  QUOTE_WAITING: 'Teklif Bekliyor',
  APPROVED: 'Onaylandı',
  IN_PROGRESS: 'Bakıma Alındı',
  PART_WAITING: 'Parça Bekleniyor',
  QUALITY_CONTROL: 'Bakım Tamamlandı',
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
};

export function statusLabel(value) {
  return labels[value] || value || '-';
}
