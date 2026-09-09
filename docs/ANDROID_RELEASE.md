# Android Release Hazırlığı

## Hazır yapı

- Paket kimliği: `com.igesa.tamirbakim`
- Expo/EAS projesi mevcut iOS projesiyle aynı.
- Canlı API: `https://tamir-bakim-api.onrender.com`
- Production çıktısı: Android App Bundle (`.aab`)
- Dahili test çıktısı: APK (`.apk`)
- EAS production profili sürüm kodunu otomatik artırır.

## Akşam aktivasyon sırası

1. Local projeyi `android-release-setup` branch'ine güncelle.
2. `apps/mobile` altında `npm.cmd install`.
3. Test cihazı için:
   `npx.cmd eas-cli@latest build -p android --profile android-preview`
4. APK Android telefonda gerçek servis senaryosuyla test edilir.
5. Google Play Console geliştirici hesabı hazırsa production build:
   `npx.cmd eas-cli@latest build -p android --profile production`
6. Google Play Console'da uygulama oluşturulur ve AAB Internal Testing kanalına yüklenir.
7. Test onayından sonra Closed/Open/Production dağıtımına geçilir.

## Notlar

- Kamera ve galeri erişimi Expo Image Picker tarafından yönetilir.
- Android üretim build'i AAB'dir; telefona doğrudan kurulum için APK profili kullanılmalıdır.
- Store aktivasyonu yapılana kadar bu branch canlı sisteme alınmak zorunda değildir.
