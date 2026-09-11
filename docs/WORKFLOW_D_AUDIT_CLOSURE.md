# Workflow D - 24 Bulgu Kapatma Kaydı

Bu belge 10 Eylül 2026 tarihli `Tamir Bakım Sistem ve İş Akışı İncelemesi` raporunu uygulama davranışıyla eşleştirir. Kaynak dal `workflowD-service-sync` olup canlıya geçiş için gerçek PostgreSQL, web, Android ve iOS kontrollerinin yeşil olması zorunludur.

| No | Uygulanan çözüm | Doğrulama |
|---|---|---|
| B01 | Kalem tamamlama ticari düzenlemeden ayrıldı; `SERVICE_ORDER_ITEM_COMPLETE` teknisyene verildi. | Yetki + atama + durum denetimi, mobil/web buton yetkisi |
| B02 | Muhasebe tahsilat yapabilir; erişilebilir şube seçenekleri ve finans ekranları aynı izinleri kullanır. | HTTP erişim smoke testi |
| B03 | Teklif kalemi iş emri kalemine bağlandı; onaylı sürüm iş listesi ve borcun kaynağıdır. | PostgreSQL iş akışı regresyonu |
| B04 | Bekleyen borç tahsilat sonrası kalan tutara iner, sıfırda `SETTLED` olur. | Kısmi/tam ödeme regresyonu |
| B05 | Statik `/uploads` kapatıldı; kısa ömürlü yetkili bağlantı kullanılır. R2 yoksa dosya PostgreSQL `MediaObject` içinde kalıcı tutulur. | İmzalı erişim + kalıcı blob regresyonu |
| B06 | Şifre/OTP/token hashleri ortak çıktı katmanında silinir; müşteri iç notları alamaz. | Güvenli çıktı birim testleri |
| B07 | Teknisyen iş emri çıktısı `vehicleId` taşır; yüklemede araç iş emrinden güvenle tamamlanır. | iOS/Android export + servis denetimi |
| B08 | Tek durum makinesi, tamamlanmamış kalem ve bakiye teslim kapıları eklendi. | Durum makinesi testleri |
| B09 | Tekrar onay idempotenttir; eski sürümler kapanır, çalışan iş geriye alınmaz. | Tekrar onay regresyonu |
| B10 | Web ve mobil aktif ekranları 5 saniye, odak ve bağlantı dönüşünde sessiz yeniler. | Web/mobil üretim derlemesi |
| B11 | Hızlı kabulde şube, gerçek fotoğraf, şablon, yakıt, hasar, eşya ve iç not alanları geri getirildi. | iOS/Android export |
| B12 | Çok araçlı müşteride açık araç seçimi gerekir; yeni araç seçeneği ve boş güncel KM kullanılır. | Mobil akış derlemesi |
| B13 | Kabul/tahsilat/fotoğraf tekrar anahtarları, transaction ve cihaz taslağı eklendi. | Eşzamanlılık + tekrar isteği regresyonu |
| B14 | Parça çıkışı onaylı iş kalemi tamamlanırken tek kez yapılır; stok hareketi aynı kimliği taşır. | Eşzamanlı stok regresyonu |
| B15 | Organizasyon bazlı PostgreSQL advisory transaction kilidi tahsilat, stok ve onayı serileştirir. | Paralel istek regresyonu |
| B16 | Teklif, atama, ek iş, parça bekleme, kalite, hazır ve teslim aşamalarında sıradaki taraf bilgilendirilir. | Veritabanı bildirim kayıtları |
| B17 | Müşteri ekranı alt modülleri özellik/izinle ayrı yükler; muhasebe müşteri/araç/finans yetkileri eşleşir. | Web build + erişim smoke testi |
| B18 | Özellik bağımlılıkları yönetim API'sinde korunur. Teklifsiz başlangıç paketi kabulden teknik atamaya geçer. | Paket yolu regresyonu/CI |
| B19 | iOS hedefi 16.4; Android ve iOS ayrı export; `main`, dal ve PR CI kapısı aktiftir. | GitHub Actions |
| B20 | Planlar iş emrine bağlanır; teslimde yalnız tamamlanan kalemler geçmişe yazılır, gerçek tarih/KM ile plan yenilenir. Aylık müşteri KM güncellemesi eklendi. | Teslim/plan regresyonu + mobil export |
| B21 | Birden fazla uygun servis varsa rastgele seçim yapılmaz; QR ile doğrulanmış servis kapsamı istenir. | Portal servis kuralı |
| B22 | Tam etiket eşleşmesi `ADI/SOYADI` ve `MODEL/MODEL YILI` karışmasını önler. | 3 OCR testi |
| B23 | Plaka mobil/API/DB'de boşluksuz büyük harfe çevrilir; eski biçim eşleşmeleri ve yarışlar korunur. | PostgreSQL trigger + kabul sorgusu |
| B24 | Açık QR yalnız servis bilgisi, iletişim ve uygulama yönlendirmesi verir; araç/müşteri/finans/geçmiş verisi doğrulama ister. | API seçimi + web üretim build |

## Operasyon sırası

1. Saha personeli müşteriyi ve doğru aracı seçer, güncel KM/tespit/fotoğrafı aynı kabul kaydına ekler.
2. Teklif özelliği açıksa ofis fiyatlandırır ve müşteriye yollar; kapalıysa iş doğrudan teknik atama bekler.
3. Teknisyen yalnız onaylı kalemleri tamamlar. Onay dışı ek parça/iş ofis kuyruğuna döner.
4. Muhasebe kalan bakiyeyi görür ve tahsilatı aynı iş emrine bağlar.
5. Bütün kalemler tamamlanınca kalite kontrol ve hazır aşaması açılır. Bakiye varsa yalnız yetkili, gerekçe ile cari teslim yapabilir.
6. Teslim; tamamlanan işlemleri ve bağlı bakım planlarını gerçek teslim tarihi/KM ile dondurur.

OTP'nin gerçek SMS/WhatsApp sağlayıcısı ve mağaza yüklemeleri harici entegrasyonlardır; bunlar test ortamı davranışı olarak gösterilmez.
