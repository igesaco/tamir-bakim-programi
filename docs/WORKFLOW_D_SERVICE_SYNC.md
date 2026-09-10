# Workflow D — servis senkronizasyonu denemesi

Başlangıç: `main` / `d3ccdfc`. Geliştirme dalı: `workflowD-service-sync`.

Bu ilk değişiklik deneme ve doğrulama altyapısını kurar. İnceleme raporundaki
24 bulgunun tamamını düzeltmez. Mevcut Render yayınları `main` üzerinde kalır.

## Bu dalın kontrolleri

`.github/workflows/workflow-d-service-sync.yml` dal güncellendiğinde veya bu
daldan main'e pull request açıldığında çalışır:

- Geçici PostgreSQL üzerinde migration, API build/lint ve mevcut erişim smoke testleri.
- Web lint/build.
- Android ve iOS için ayrı Expo export işleri.
- Mobil bağımlılıkları sabitleyen package-lock ve CI'da npm ci kurulumu.
- Deneme mobil profilinin canlı API'ye veya eksik adrese bağlanmasını önleyen testler.

iOS minimum sürümü mevcut Expo bağımlılığının istediği `16.4` olarak düzeltildi.
Expo export, JavaScript paketleme kontrolüdür; imzalı IPA, Xcode native build,
App Store kabulü veya telefonda kamera/OCR testinin yerine geçmez.

## Deneme ortamının bağlantıları

| Bileşen | Gerekli deneme ayarı |
| --- | --- |
| Render API | `workflowD-service-sync`, kök `apps/api`, ayrı deneme veritabanı |
| Render web | Aynı dal, kök `apps/web`, `VITE_API_URL` deneme API adresi |
| PostgreSQL | Canlıdan ayrı, yalnızca örnek müşteri/araç kayıtları |
| API CORS | Deneme web adresi |
| API kimlik doğrulama | Canlıdan farklı JWT/portal anahtarları |
| Fotoğraflar | Denemeye ayrılmış depolama; canlı dosyaları kullanılmaz |
| Mobil EAS | `preview` environment, `EXPO_PUBLIC_API_URL` ayrı HTTPS deneme API adresi |

Bu dosya oluşturulurken yeni Render servisi/veritabanı veya EAS ortam değişkeni
oluşturulmadı. Gerçek deneme API adresi hazır olana kadar trial build eksik
adres hatasıyla durur. CI'daki `.invalid` adres yalnızca derleme kontrolü içindir;
telefon üzerinde kullanılabilecek bir deneme sunucusu değildir.

Adres kontrolü bilinen canlı API adresini reddeder. Yeni bir adresin gerçekten
ayrı veritabanını kullandığı ayrıca Render yapılandırmasından doğrulanmalıdır.

## Android ve iOS

Mobil ekranlar `apps/mobile` altındaki ortak React Native kodundan üretilir.
API düzeltmeleri de iki platform için aynı deneme sunucusunda çalışır.

| Profil | Kullanım |
| --- | --- |
| `workflowD` | Android APK / kayıtlı iOS cihazlara internal dağıtım |
| `workflowD-testflight` | Mevcut Apple uygulamasına TestFlight için store build |
| `preview`, `production` | Mevcut profiller; Workflow D denemesi için kullanılmaz |

Deneme profillerinin uygulama adı **Tamir Bakım Deneme** olur. Bundle identifier
ve Android package aynı kalır; TestFlight mevcut Apple uygulama kaydını kullanır.
Bu nedenle deneme ve normal sürüm aynı cihazda iki ayrı uygulama olarak kurulmaz.
TestFlight dağıtımı App Store'a herkese açık yayın yapmak değildir.

EAS `preview` ortamındaki API adresi tanımlandıktan ve CI başarılı olduktan sonra,
`apps/mobile` klasöründen ilgili derleme başlatılır:

```sh
npx eas-cli build --platform android --profile workflowD
npx eas-cli build --platform ios --profile workflowD-testflight
```

iOS build başarılı olduktan sonra **bu build'in kimliği** kullanılarak gönderilir;
farklı bir dalın son build'ini yanlışlıkla göndermemek için `--latest` kullanılmaz:

```sh
npx eas-cli submit --platform ios --profile workflowD-testflight --id BUILD_ID
```

EAS ve Apple hesap erişimi, imzalama/provisioning ve TestFlight test grubu gereklidir.
Bu komutlar GitHub CI tarafından otomatik çalıştırılmaz. Bu değişiklik kendi
başına bir IPA/APK üretmez veya mevcut telefondaki uygulamayı güncellemez.

## İlk düzeltme paketleri

1. Teknisyen kalem tamamlama/fotoğraf erişimi, ofis yetkileri, güvenli API ve dosya erişimi.
2. Teklif, onaylı iş kalemleri, borç ve tahsilatın ortak kaydı.
3. Kabul tekrar denemesi, doğru araç seçimi, parça ve teslim geçişleri.
4. Ofis/teknisyen ekranlarının güncellenmesi ve sorumluya görev yönlendirmesi.

Her paket aynı örnek iş emriyle iki ayrı rol hesabından denenir. iOS ve Android'de
kabul, fotoğraf/OCR, teklif onayı, tamamlama, parça talebi, kısmi ödeme ve teslim
sonuçları web paneliyle karşılaştırılır. Bağlantı kopması ve çift gönderim ayrıca
denenir. İşlev düzeltmeleri tamamlanmadan bu altyapı değişikliği “hatalar çözüldü”
olarak değerlendirilmemelidir.

## Resmî başvuru belgeleri

- https://docs.expo.dev/build/eas-json/
- https://docs.expo.dev/eas/environment-variables/usage/
- https://docs.expo.dev/submit/testflight/
