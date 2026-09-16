# TamirApp Ürün Güçlendirme Yol Haritası

Tarih: 15 Eylül 2026  
Kaynak: `TAMIRAPP_UC_ROL_URUN_BOSLUK_ANALIZI.html`  
Amaç: Tamirci, müşteri ve kurucu ihtiyaçlarını tek, çakışmasız servis akışında birleştirmek.

## 1. Ürün ilkeleri

1. Her araç ziyareti tek bir iş emridir. Kabul, inceleme, teklif, müşteri kararı, parça, işçilik, ödeme, teslim ve garanti aynı kayda bağlanır.
2. Her aşamanın tek sorumlusu vardır. Yetki ekran gizlemekle değil API seviyesinde uygulanır.
3. Kritik işlemler tekrar gönderildiğinde ikinci kayıt üretmez. Tahsilat, stok düşümü, teklif onayı ve teslim idempotent çalışır.
4. Kullanıcı hatayı teknik kod olarak değil, ne yapması gerektiğini söyleyen Türkçe açıklama olarak görür.
5. Hızlı ekranlar özet veri; ayrıntı ekranları gerektiğinde ayrıntı getirir. Liste ekranlarında ağır ilişkiler taşınmaz.
6. Müşteri onayı fiyat ve kapsamı kilitler. Onaysız iş kalemi tamamlanamaz ve stok tüketemez.
7. Her kritik değişiklik kim, ne zaman, önceki değer ve yeni değer ile izlenebilir.

## 2. Gerçek durum envanteri

| Alan | Bugünkü durum | Boşluk | Karar |
|---|---|---|---|
| İş emri durum akışı | Var ve API kurallarıyla korunuyor | Günlük operasyon tek bakışta görünmüyor | Aşama bazlı atölye panosu |
| Tahmini teslim | Veri alanı var | Gecikme ve kapasite görünürlüğü zayıf | Panoda ETA/gecikme; sonra kapasite hesabı |
| Teklif kalemleri | Kalem ve onay alanı var | Müşteri yalnız tüm teklifi onaylıyor | Kalem bazlı karar + yeniden hesaplanan onay toplamı |
| Stok | Giriş/çıkış ve negatif stok koruması var | Rezervasyon ve satın alma talebi yok | Onayda rezervasyon, eksikte tedarik kuyruğu |
| Teknisyen kayıtları | Not ve parça kullanımı var | Başlat/durdur ve gerçek süre yok | İş oturumu ve verim ölçümü |
| Fotoğraf/medya | Yetki kontrollü kalıcı depolama var | Saklama politikası ve müşteri belge kasası eksik | Yaşam döngüsü, sınıflandırma ve indirme |
| Müşteri portalı | Araç, bakım, teklif, ödeme ve randevu verisi var | Net zaman çizgisi ve işlem bazlı açıklama zayıf | Sade durum çizgisi, karar merkezi, belge kasası |
| Garanti/tekrar iş | Bakım geçmişi var | Garanti süresi ve geri dönüş kaydı yok | Garanti cüzdanı ve tekrar iş emri bağı |
| Randevu | Temel randevu var | Servis kapasitesiyle bağlı değil | Teknisyen/lift/süre kapasitesi |
| Araç kabul | Hızlı kabul, OCR ve taslak var | Uzun form ve eksik veri yönlendirmesi | Adımlı sihirbaz ve tamamlanma özeti |
| Ruhsat OCR | Etiket ve alan kodu okuma geliştirildi | Gerçek cihaz/ışık çeşitliliği testi eksik | Galeri+kamera, kalite uyarısı, test veri seti |
| Bildirim | Uygulama içi altyapı var | Kanal politikası ve teslim görünürlüğü eksik | Uygulama içi merkez; SMS daha sonra ücretli sağlayıcıyla |
| WhatsApp doğrulama | Kod hazır fakat operasyonel bağımlılık yüksek | Geliştirmede girişleri zorlaştırıyor | Şimdilik kapalı; güvenilir SMS sağlayıcısına kadar devre dışı |
| Yönetim/rapor | Temel metrikler var | Kurucu kokpiti, hata görünürlüğü ve kullanım analitiği eksik | Operasyon, hata ve kullanım panoları |
| Performans | Çalışır | 5 sn polling ve ağır liste sorguları | 30 sn kontrollü yenileme, hafif özet uçları, ölçüm |

## 3. Faz 0 — Güven ve hız temeli (P0)

Hedef süre: 1–2 geliştirme döngüsü.

### 3.1 Performans

- Dashboard için yalnız gerekli alanları döndüren `/service-orders/board` ucu.
- Canlı yenileme 30 saniye; pencere odağa gelince ve veri değişince anlık yenileme.
- Aynı anda çalışan istekleri birleştirme; eski veri ekranda kalırken sessiz yenileme.
- Liste uçlarında sayfalama, arama gecikmesi ve seçili alanlar.
- API süreleri için p50/p95 ölçümü; yavaş sorgu eşiği 750 ms.
- Render soğuk başlangıcı ürün hatasından ayıran bağlantı durumu.

Kabul ölçütleri:

- Sıcak API’de dashboard ilk veri yanıtı p95 altında 1 saniye.
- Dashboard yenilemesi ağır `/service-orders` cevabını kullanmaz.
- Sekme arka plandayken polling yapılmaz.
- Bağlantı hatasında sayfa boşalmaz; son veri ve tekrar dene eylemi görünür.

### 3.2 Veri bütünlüğü ve hata deneyimi

- Tahsilat için tutar, şube, teklif ve açık bakiye kurallarını aynı doğrulama sözleşmesinde toplama.
- Şube oluşturma/seçme hatalarını veritabanı ve kullanıcı mesajı düzeyinde ayırma.
- Çift tıklama koruması ve istemci istek anahtarı.
- Form bildirimlerini üstte kaybolan bant yerine ilgili formun yanında kalıcı sonuç kartı/toast olarak gösterme.
- Beklenmeyen hatalara izleme kimliği ekleme; kullanıcıya bu kimlikle destek yolu sunma.

Kabul ölçütleri:

- Aynı tahsilat isteği iki kez gönderilse tek ödeme oluşur.
- Geçersiz işlemde API alan bazlı hata döndürür; konsolda kontrolsüz promise hatası oluşmaz.
- Başarı bildirimi 5–8 saniye görünür, ilgili kayda gitme bağlantısı taşır.

### 3.3 Geliştirme girişi

- WhatsApp doğrulaması geliştirme sürecinde kapalı.
- Müşteri hesabı telefon numarasıyla bulunur; geliştirme ortamında kontrollü test kodu akışı kullanılır.
- Canlıya çıkıştan önce SMS sağlayıcısı, maliyet limiti, hız sınırı ve kötüye kullanım koruması zorunludur.

## 4. Faz 1 — Servis operasyonu (P0/P1)

### 4.1 Atölye panosu

- Sütunlar: giriş/kontrol, müşteri onayı, işlem, parça, kalite, teslim/ödeme.
- Kartta plaka, araç, müşteri, teknisyen, şube, kalem ilerlemesi ve teslim hedefi.
- Geciken, teknisyensiz ve teslim tarihi olmayan işler ayrı uyarılır.
- Filtreler: şube, teknisyen, durum, geciken ve plaka.

### 4.2 Adımlı araç kabul

1. Müşteri: telefonla ara veya yeni müşteri oluştur.
2. Araç: plaka/VIN ile ara, ruhsatı kamera ya da galeriden oku.
3. Şikâyet: müşteri beyanı, sesle yazma, hızlı şablonlar.
4. Kontrol: kilometre, yakıt, hasar diyagramı, fotoğraflar ve eşyalar.
5. Plan: ön inceleme, sorumlu danışman, tahmini kontrol zamanı.
6. Onay: KVKK/teslim koşulları, dijital imza ve özet.

Kurallar:

- Her adım taslak kaydeder ve geri dönülebilir.
- Zorunlu alanlar adım değişirken doğrulanır.
- OCR düşük güvenli alanı sarı gösterir; kullanıcı onayı olmadan ana kayda yazmaz.
- Aynı plaka veya telefon için mükerrer kayıt uyarısı verir.

### 4.3 Teknisyen çalışma ekranı

- “Başlat, duraklat, tamamla” iş oturumu.
- Kalem bazında fotoğraf, not, kullanılan parça ve ek iş talebi.
- Ek iş fiyatlandırılmadan ve müşteri onayı alınmadan tamamlanamaz.
- Çevrimdışıyken yalnız not/fotoğraf taslağı; durum ve stok işlemi çevrimiçi yapılır.

### 4.4 Parça rezervasyonu ve tedarik

- Onaylı parça kalemi için stok rezervasyonu.
- Yetersiz stokta otomatik satın alma talebi ve `PART_WAITING` önerisi.
- Rezerve, kullanılabilir ve fiziksel stok ayrı gösterilir.
- Kalem iptalinde rezervasyon serbest bırakılır; kullanımda atomik stok düşer.

Kabul ölçütleri:

- İki teknisyen son parçayı aynı anda kullanamaz.
- Onaysız parça rezerve edilmez/düşülmez.
- İptal edilen iş stokta hayalet rezervasyon bırakmaz.

## 5. Faz 2 — Müşteri güveni (P1)

### 5.1 Karar merkezi

- Müşteri her teklif kalemini kabul veya reddeder.
- İşçilik, parça, KDV ve toplam sade açıklanır.
- Onaylanan toplam ayrı kilitlenir; reddedilen kalem iş emrinde tamamlanamaz.
- Fiyat artışı için yeni teklif sürümü ve yeniden onay gerekir.
- “Bu tutarı aşma” fiyat limiti tercihi.

### 5.2 Servis zaman çizgisi

- Araç kabul edildi, incelendi, teklif gönderildi, onaylandı, işlemde, kontrolde, hazır.
- Her adımda son güncelleme, beklenen sonraki adım ve tahmini zaman.
- Gecikmede neden ve yeni tahmin; sessiz durum değişikliği yok.

### 5.3 Garanti ve belge kasası

- Tamamlanan kaleme garanti süresi/mesafe bilgisi.
- Tekrar iş emrini asıl iş ve kalemle ilişkilendirme.
- Teklif, onay, teslim formu, fatura ve önce/sonra fotoğraflarını güvenli indirme.
- Veriye erişim, saklama ve silme talepleri için kayıtlı süreç.

### 5.4 Randevu deneyimi

- Müşteri panelinden uygun zaman seçme, iptal ve yeniden planlama.
- Hizmet türüne göre tahmini süre ve servis kapasitesi.
- Yaklaşan bakım planından tek dokunuşla randevu.
- No-show ve iptal politikası görünür.

## 6. Faz 3 — Kurucu ölçeği (P1/P2)

- Organizasyon/şube/personel için kendi kendine kurulum sihirbazı.
- Excel müşteri, araç, stok ve geçmiş bakım içe aktarma; önce prova ve hata raporu.
- Abonelik, paket, deneme süresi, kullanım limiti ve faturalama.
- Kurucu kokpiti: aktif servisler, dönüşüm, tahsilat, gecikme, tekrar iş, kullanıcı etkinliği.
- Destek kokpiti: hata kimliği, son API olayları, bildirim teslimi ve tenant bazlı sağlık.
- Günlük yedek, geri yükleme provası, dışa aktarma ve hesap kapatma.
- Feature flag ile kontrollü yayın ve hızlı geri alma.
- Muhasebe/e-fatura, parça tedarikçisi ve takvim entegrasyonları.

## 7. Test stratejisi

| Katman | Zorunlu test |
|---|---|
| Birim | Durum geçişi, fiyat, bakiye, stok, OCR, yetki |
| Entegrasyon | Gerçek PostgreSQL üzerinde paralel tahsilat/stok/onay/teslim |
| API güvenlik | Tenant sızıntısı, rol/yetki, medya, hız sınırı |
| Web | Kabul, teklif, teknisyen, tahsilat, teslim ve hata mesajı |
| Mobil | Kamera/galeri, düşük ağ, taslak devamı, Android/iOS export |
| Kullanılabilirlik | Tamirci, danışman ve müşteriyle görev tamamlama süresi |
| Performans | Dashboard p50/p95, sorgu sayısı, cevap boyutu, soğuk/sıcak başlangıç |
| Kurtarma | Yedekten dönme, başarısız migration, yarım kalan işlem |

Her fazın yayın kapısı:

1. Otomatik testler yeşil.
2. İzole test tenantında senaryo testi tamam.
3. Migration geri dönüş veya ileri düzeltme planı hazır.
4. Hata ve performans gözlemi hazır.
5. Kontrollü canlı dağıtım ve sağlık kontrolü başarılı.

## 8. Şimdilik yapılmayacaklar

- WhatsApp ile otomatik OTP: operasyonel kurulum ve maliyet netleşene kadar kapalı.
- Yapay zekâ ile otomatik arıza kararı: veri ve sorumluluk modeli oluşmadan önerilmeyecek.
- Çok geniş pazaryeri/tedarik ağı: temel rezervasyon ve satın alma kuyruğu oturmadan başlamayacak.
- Tam çevrimdışı durum/stok/ödeme: çakışma riski nedeniyle yalnız taslak veri çevrimdışı tutulacak.
- App Store genel yayını: kapalı TestFlight kabul testleri tamamlanmadan yapılmayacak.

## 9. Başarı göstergeleri

- Kabul kaydı medyan tamamlama süresi 4 dakikanın altında.
- Tekliften müşteri kararına dönüşüm ve medyan süre ölçülebilir.
- Geciken iş oranı ve sebepleri görünür; sahipsiz aktif iş sıfıra yakın.
- Stok tutarsızlığı ve çift tahsilat sıfır.
- Tekrar iş/garanti dönüş oranı ölçülebilir.
- Kritik akışlarda kontrolsüz 5xx sıfır; hata mesajlarının tamamı eylem önerir.
- Müşteri, aracının mevcut durumunu destek araması yapmadan anlayabilir.

## 10. Uygulama sırası

1. Hafif atölye panosu ve polling azaltma.
2. Tahsilat/şube/bildirim hata sözleşmesi ve idempotency.
3. Adımlı kabul ile OCR kalite doğrulaması.
4. Teknisyen süre takibi ve ek iş akışı.
5. Parça rezervasyonu ve tedarik kuyruğu.
6. Kalem bazlı müşteri kararı ve fiyat kilidi.
7. Müşteri zaman çizgisi, garanti ve belge kasası.
8. Kapasiteye bağlı randevu.
9. Kurucu gözlem, yedek, içe aktarma ve abonelik.
10. TestFlight kapalı beta, saha testi, düzeltme ve mağaza hazırlığı.

## 11. 15 Eylül 2026 uygulama durumu

Tamamlanan ürün çekirdeği:

- Hafif atölye panosu, 30 saniyelik kontrollü yenileme ve odaklanınca güncelleme.
- Tahsilat/bakiye/şube hata sözleşmeleri ile çift işlem koruması.
- Altı adımlı mobil araç kabulü; kamera ve galeriden ruhsat/kabul fotoğrafı; kalıcı taslak.
- Teknisyen iş oturumu: başlat, durdur, kalem bağlantısı ve gerçek süre.
- Onaylı parçada satır kilitli stok rezervasyonu; eksikte otomatik tedarik talebi.
- Teklifte kalem bazlı müşteri kararı ve değiştirilemeyen onay toplamı.
- Müşteri servis zaman çizgisi, tahmini teslim, randevu talebi ve randevu geçmişi.
- Kalem bazlı ay/km garantisi, müşteri garanti cüzdanı ve asıl işe bağlı garanti dönüşü.
- Teknisyen çakışmasını engelleyen süreli randevu planı.
- Kurucu raporlarında geciken, teknisyensiz, parça/teklif bekleyen işler, aktif işçilik,
  tedarik ve garanti dönüş sayıları.
- Excel'den CSV UTF-8 biçiminde müşteri/araç içe aktarma; prova, mükerrerlik ve hata raporu.
- Feature/permission tabanlı paket kontrolü ve platform yönetim ekranı.

Canlı geçiş kapısı:

1. Kod etiketi ve Render PostgreSQL otomatik anlık görüntüsüyle geri dönüş noktası.
2. Gerçek PostgreSQL üzerinde migration ve yarış senaryoları.
3. API, web, Android ve iOS CI doğrulaması.
4. Render sağlık/log kontrolü.
5. TestFlight kapalı beta ve saha kabul listesi.

Dış hizmet kararı gerektirenler:

- Otomatik SMS/WhatsApp OTP geliştirme sürecinde kapalı kalır. Üretimde etkinleştirmek için
  ücretli, teslim raporlu bir SMS sağlayıcısı ve kötüye kullanım limiti seçilmelidir.
- App Store genel yayını, TestFlight saha kabulü tamamlanmadan başlatılmaz.
- Ücretsiz Render PostgreSQL 7 Ekim 2026'dan önce kalıcı pakete geçirilmelidir.
