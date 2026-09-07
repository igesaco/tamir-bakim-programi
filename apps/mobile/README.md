# Tamir Bakım Mobile

İlk mobil sürüm mevcut personel hesaplarıyla aynı API'ye bağlanan Expo/React Native uygulamasıdır.

## Teknoloji

- Expo SDK 57
- React Native 0.86
- React 19.2.3

## Başlatma

Bu klasörde:

```powershell
npm.cmd install
npm.cmd run start
```

Expo Go veya Android/iOS emülatörü ile açabilirsiniz.

## API adresi

`.env` oluşturun:

```env
EXPO_PUBLIC_API_URL=https://tamir-bakim-api.onrender.com
```

Gerçek telefondan local API kullanacaksanız `localhost` yerine bilgisayarın yerel ağ IP adresini kullanın. Örnek:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

## İlk sürüm kapsamı

- Personel girişi
- Rol bilgisini API'den alma
- OWNER/MANAGER/SERVICE_ADVISOR için müşteri listesi
- Rol bazlı iş emri listesi
- TECHNICIAN için yalnızca API'nin döndürdüğü atanmış işler
- Mobil özet ekranı

Sonraki mobil faz:

- Müşteri detay ekranı
- Araç detay + QR tarama
- Teknisyen iş durumu değiştirme
- Fotoğraf yükleme
- Randevular
- Push bildirimleri
- Güvenli kalıcı oturum
