# ChatGPT Başlangıç Promptu — Tamir Bakım Programı

Aşağıdaki bağlamı bu konuşmanın ana sistem tanımı olarak kabul et. Bu projeyle ilgili cevap verirken varsayım yapmadan önce mevcut repository dosyalarını incele. Özellikle DTO, controller, service, Prisma schema, permission ve feature yapısını tahmin etme; gerçek koddan doğrula.

## Proje

GitHub repository:

```text
igesaco/tamir-bakim-programi
```

Aktif geliştirme branch'i:

```text
feature/core-workflow-v2
```

Windows local proje yolu:

```text
C:\Users\bilgi\OneDrive\Desktop\tamir-bakim-programi
```

Proje bir oto servis / sanayi yönetim sistemidir.

Ana uygulamalar:

```text
apps/api     = NestJS + Prisma + PostgreSQL backend
apps/web     = React + Vite web yönetim paneli
apps/mobile  = Expo + React Native personel mobil uygulaması
```

Canlı adresler:

```text
Web: https://tamir-bakim-programi.onrender.com
API: https://tamir-bakim-api.onrender.com
```

## Kullanıcı Katmanları

Sistem 3 kullanıcı katmanına sahiptir.

### 1. İGESA / Platform

Tenant kullanıcısından ayrıdır.

Model:

```text
PlatformUser
```

Roller:

```text
FOUNDER
ADMIN
SUPPORT
```

Platform:

- tüm işletmeleri görür,
- paket değiştirir,
- modül feature açıp kapatır,
- rol permission ayarlar,
- işletme paneline impersonation ile girer.

Ajans işletmeye girdiğinde:

```text
actorType = TENANT_IMPERSONATION
```

Ajans erişimi tenant permission kısıtını aşabilir fakat audit ile izlenmelidir.

### 2. Sanayici / Tenant

Model:

```text
Organization
```

Personel rolleri:

```text
OWNER
MANAGER
SERVICE_ADVISOR
TECHNICIAN
WAREHOUSE
ACCOUNTING
```

Tenant kullanıcısının erişimi:

```text
Role
+ Package Features
+ Organization Feature Overrides
+ Role Permission Overrides
= Effective Access
```

### 3. Sanayicinin Müşterisi

Public müşteri portalını kullanır.

Akış:

```text
T.C. Kimlik No
+ Plaka
+ OTP
→ sadece doğrulanan araç
→ müşteri bilgi
→ cari
→ ödeme hareketleri
```

T.C. Kimlik No düz metin saklanmaz.

## Paketler

3 hazır paket vardır:

```text
STARTER       = Servis Başlangıç
PROFESSIONAL  = Servis Profesyonel
PREMIUM       = Servis 360
```

Feature enum:

```text
DASHBOARD
CUSTOMERS
VEHICLES_QR
SERVICE_ORDERS
APPOINTMENTS
MAINTENANCE
QUOTES
INVENTORY
SUPPLIERS
STAFF
BRANCHES
NOTIFICATIONS
CASHIER
REPORTS
SETTINGS
INSPECTIONS
MEDIA
CUSTOMER_PORTAL
AUDIT
```

İşletmeye özel override:

```text
OrganizationFeatureOverride
```

## Detay Permission

Permission enum'u:

```text
PermissionKey
```

Başlıca izinler:

```text
CUSTOMER_VIEW
CUSTOMER_CREATE
CUSTOMER_UPDATE
CUSTOMER_DELETE

VEHICLE_VIEW
VEHICLE_CREATE
VEHICLE_UPDATE
VEHICLE_DELETE
VEHICLE_QR

SERVICE_ORDER_VIEW
SERVICE_ORDER_CREATE
SERVICE_ORDER_EDIT
SERVICE_ORDER_ASSIGN
SERVICE_ORDER_STATUS
SERVICE_ORDER_ITEM_MANAGE
SERVICE_ORDER_WORKLOG

APPOINTMENT_VIEW
APPOINTMENT_MANAGE

QUOTE_VIEW
QUOTE_CREATE
QUOTE_STATUS

MAINTENANCE_VIEW
MAINTENANCE_MANAGE

INVENTORY_VIEW
INVENTORY_MANAGE

SUPPLIER_VIEW
SUPPLIER_MANAGE

STAFF_VIEW
STAFF_CREATE
STAFF_UPDATE
STAFF_PASSWORD

BRANCH_VIEW
BRANCH_MANAGE

NOTIFICATION_VIEW
NOTIFICATION_MANAGE

CASHIER_VIEW
CASHIER_COLLECT
CASHIER_STATUS

REPORTS_VIEW

SETTINGS_VIEW
SETTINGS_MANAGE

INSPECTION_VIEW
INSPECTION_MANAGE

MEDIA_VIEW
MEDIA_UPLOAD
MEDIA_DELETE
```

İşletme bazlı detay override modeli:

```text
OrganizationRolePermissionOverride
```

Backend güvenliği sadece frontend görünürlüğüne bırakılmaz. Controller seviyesinde `@Feature` ve `@Permission` kontrolü uygulanır.

## Teknik Personel

TECHNICIAN varsayılan olarak atanmış iş emirlerine odaklanır.

İzinli servis durumları:

```text
ACCEPTED
IN_PROGRESS
PART_WAITING
QUALITY_CONTROL
READY
```

Türkçe:

```text
Bakıma Alındı
Bakım Sırası Bekliyor
Parça Bekleniyor
Bakım Tamamlandı
Teslimata Hazır
```

## Ana Modüller

Backend ve web tarafında ana modüller:

- müşteri,
- araç,
- QR,
- randevu,
- inspection / araç kabul,
- iş emri,
- teklif / proforma,
- bakım,
- stok,
- tedarikçi,
- medya,
- bildirim,
- kasa / tahsilat,
- rapor,
- audit,
- şube,
- personel,
- ayarlar.

## Web Görünümü

3 UI modu vardır:

```text
Klasik
Masaüstü
Çalışma Alanı
```

Masaüstü modu Windows benzeri:

- uygulama ikonları,
- klasör/pencere mantığı,
- sekmeler,
- görev çubuğu,
- büyüt/küçült/kapat,
- Sade / Teknik / Füme wallpaper.

Koyu ve Aydınlık tema vardır.

## Mobil

Expo + React Native personel uygulaması.

Mevcut mobil ekranlar:

```text
Ana Sayfa
Müşteriler
İşler
Stok
Kasa
Araç Kabul
Bildirimler
Hesabım
```

Mobil menü role + feature + permission'a göre oluşur.

Token SecureStore'da saklanır.

Fiziksel telefonda local API için PC LAN IP kullanılır.

Windows Mobile Hotspot için test edilmiş örnek:

```env
EXPO_PUBLIC_API_URL=http://192.168.137.1:3000
```

## Devam Eden Mobil Geliştirme

`ServiceOrderWorkLog` modeli eklenmektedir / geliştirme aşamasındadır.

Amaç:

- yapılan işlem notu,
- kullanılan parça,
- işlem zamanı,
- işlemi yapan personel,
- iş emri zaman çizelgesi.

Work log tipleri:

```text
NOTE
PART_USED
```

Bu kısmı tamamlanmış varsayma; mevcut branch kodunu okuyup migration/build durumunu doğrula.

## Güvenlik

Değişmez kurallar:

1. Tenant verisi organizationId olmadan sorgulanmaz.
2. Branch scope gereken rollerde branchId korunur.
3. Backend feature + permission kontrolü zorunludur.
4. T.C. Kimlik No loglanmaz ve düz metin saklanmaz.
5. Platform user ile tenant user birbirine karıştırılmaz.
6. Customer portal JWT ile personel JWT farklı amaçtadır.
7. .env secret'ları asla kullanıcıya tekrar yazdırılmaz.
8. Production media storage Render local disk üzerinde kalıcı kabul edilmez.
9. Migration olmadan schema değişikliği yapılmaz.
10. Mevcut tenant dataları silinmez.

## Local Test

Project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\verify-core-v2.ps1
```

Health:

```text
GET /health
```

Beklenen:

```text
status: ok
database: ok
```

CI:

```text
.github/workflows/core-v2-ci.yml
```

CI içinde API, Prisma, migration, auth smoke, web build ve mobile bundle kontrolleri vardır.

## Çalışma Şeklin

Bu projede bana destek verirken:

- önce ilgili dosyaları oku,
- gerekiyorsa repository'yi ara,
- alan / DTO / endpoint tahmin etme,
- tam dosya değişikliği gerekiyorsa net belirt,
- hangi klasörde komut çalışacağını açıkça yaz,
- büyük değişikliklerde migration etkisini kontrol et,
- backend + web + mobile etkisini birlikte düşün,
- feature ve permission modelini bozmamaya dikkat et,
- tamamlanmamış özelliği tamamlanmış gibi anlatma,
- test etmeden “%100 bitti” deme.

Ben genellikle hızlı ve doğrudan ilerlemek istiyorum. Kod düzeltmelerinde mümkünse bana parçalı “şuraya ekle” yerine tam dosya veya tek blok PowerShell komutu ver.

Bu promptu aldıktan sonra projeyi artık genel bir CRM gibi değil, yukarıdaki mimariye sahip mevcut Tamir Bakım sistemi olarak ele al.
