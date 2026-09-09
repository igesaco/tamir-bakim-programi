# Service Flow V3

## Amaç

Mevcut sistemi bozmadan, araç kabulünden teslime kadar tek iş emri etrafında çalışan yeni servis akışını devreye almak.

## Güvenli geliştirme stratejisi

- `main` ve `workflowA` mevcut çalışan sistem olarak korunur.
- Geri dönüş noktası: `backup/pre-service-flow-v3-20260909`
- Yeni geliştirme branch'i: `workflowB-service-flow-v3`
- Legacy endpointler korunur.
- Yeni akış için V3 endpointleri eklenir.
- V3 doğrulanmadan `main` üzerine alınmaz.
- Veri silme/reset yapılmaz.
- Şema değişiklikleri sadece additive migration ile yapılır.

## Ana iş akışı

1. Araç kabul
2. Yeni/kayıtlı müşteri seçimi
3. Yeni/kayıtlı araç seçimi
4. KM + müşteri talebi + ön teknik not
5. Kabul fotoğrafları
6. Hazır işlem paketi veya manuel işlem seçimi
7. Ön iş emri
8. Fiyatlandırma bekliyor
9. Proforma/teklif
10. Müşteri onayı
11. İş emri onaylandı
12. Teknisyene bildirim
13. İşlem başladı / parça bekleniyor / kalite kontrol
14. Teslimata hazır
15. Ödeme/tahsilat
16. Teslim
17. Bakım geçmişi
18. QR dijital bakım kartı

## Ana durum haritası

- ARRIVED: Araç geldi
- INSPECTION: Teknik inceleme
- QUOTE_WAITING: Fiyatlandırma / müşteri onayı bekliyor
- APPROVED: İş emri onaylandı
- IN_PROGRESS: Servis işlemi başladı
- PART_WAITING: Parça bekleniyor
- QUALITY_CONTROL: Kalite kontrol / son kontrol
- READY: Teslimata hazır
- PAYMENT_WAITING: Ödeme bekliyor
- DELIVERED: Teslim edildi
- CANCELLED: İptal

## Fazlar

### Faz 1
Mobil araç kabul + hazır işlem paketleri + muhasebe kuyruğu.

### Faz 2
Teklif/proforma + müşteri onayı + cari bekleyen ödeme.

### Faz 3
Teknisyen işlem adımları + fotoğraflar + parça bekleniyor.

### Faz 4
Müşteri uygulaması canlı servis takibi + bildirimler + müşteri görünür fotoğraflar.

### Faz 5
Teslim + ödeme + bakım geçmişi + QR bakım kartı.

## Rollback

Yeni akışta kritik problem olursa:

- Canlıya alınmışsa `main` ref'i güvenli commit'e geri döndürülür.
- Geliştirme tarafında `workflowB-service-flow-v3` bırakılır.
- `workflowA` ve `backup/pre-service-flow-v3-20260909` değiştirilmez.

Bu belge V3 geliştirmelerinin geri dönüş referansıdır.
