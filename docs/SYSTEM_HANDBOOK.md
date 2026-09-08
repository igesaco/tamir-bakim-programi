# Tamir Bakım Programı — Sistem Kullanım ve Geliştirici Kılavuzu

> Bu belge, projeye ilk kez dahil olan bir yazılımcının sistemi A'dan Z'ye anlayabilmesi için hazırlanmıştır. Aynı zamanda destek, bakım, hata analizi, yeni özellik geliştirme ve deployment süreçlerinde referans doküman olarak kullanılmalıdır.

---

## 1. Projenin Amacı

Tamir Bakım Programı, oto servisleri / sanayi işletmeleri için geliştirilen çok kiracılı (multi-tenant) bir servis yönetim sistemidir.

Sistem üç ayrı kullanıcı dünyasını destekler:

1. **İGESA / platform yöneticileri**
   - Sistemin sahibi / geliştirici tarafıdır.
   - Tüm işletmeleri görebilir.
   - İşletmelere paket atayabilir.
   - Paket dışı modül açıp kapatabilir.
   - Rol bazlı detay yetkileri düzenleyebilir.
   - Gerektiğinde işletme paneline ajans erişimiyle girebilir.

2. **Sanayici / servis işletmesi**
   - İGESA'nın müşterisidir.
   - Kendi organizasyonundaki müşteri, araç, iş emri, stok, tahsilat vb. verileri görür.
   - Kullanabileceği modüller satın aldığı paket ve İGESA'nın özel yetki ayarlarına göre belirlenir.
   - Kendi personelini oluşturabilir ve rollere göre yetkilendirebilir.

3. **Sanayicinin müşterisi**
   - Son kullanıcıdır.
   - Kendi araç ve finans bilgilerini müşteri portalından görüntüler.
   - Portal erişimi T.C. Kimlik No + plaka + SMS/OTP doğrulama mantığı ile sınırlandırılır.
   - Sadece doğrulanan araçla ilişkili bilgi, cari ve ödeme verisi gösterilir.

---

## 2. Ana Mimari

Repository:

```text
igesaco/tamir-bakim-programi
```

Aktif geliştirme branch'i:

```text
feature/core-workflow-v2
```

Ana klasör yapısı:

```text
tamir-bakim-programi/
├─ apps/
│  ├─ api/        NestJS + Prisma + PostgreSQL backend
│  ├─ web/        React + Vite web uygulaması
│  └─ mobile/     Expo + React Native mobil personel uygulaması
├─ .github/
│  └─ workflows/ CI testleri
└─ verify-core-v2.ps1
```

Teknoloji özeti:

- Backend: NestJS
- ORM: Prisma
- Veritabanı: PostgreSQL 17
- Web: React + Vite
- Mobil: Expo + React Native
- Kimlik doğrulama: JWT
- Local güvenli token saklama (mobil): Expo SecureStore
- Deployment: Render
- Source control: GitHub

---

## 3. Multi-Tenant Yapı

Her sanayici işletmesi bir `Organization` kaydıdır.

Temel tenant ilişkileri:

- Organization
- Branch
- User
- Customer
- Vehicle
- Appointment
- Inspection
- ServiceOrder
- Quote
- Maintenance
- Supplier
- Part
- Inventory
- Payment
- Notification
- AuditLog

Ana kural:

> Bir tenant kullanıcısı yalnızca kendi `organizationId` alanına ait verileri görmelidir.

Şube seviyesinde çalışan rollerde ek olarak `branchId` filtresi uygulanır.

---

## 4. Platform / İGESA Yetki Sistemi

Platform kullanıcıları tenant kullanıcılarından ayrı tutulur.

Prisma modeli:

```text
PlatformUser
```

Platform rolleri:

```text
FOUNDER
ADMIN
SUPPORT
```

Ajans paneli giriş adresi:

```text
/platform-login
```

Ajans yönetim paneli:

```text
/platform
```

Platform yetenekleri:

- tüm işletmeleri listeleme,
- aktif paketi görme,
- paket değiştirme,
- modül override açma/kapatma,
- rol bazlı detay izin değiştirme,
- işletme paneline impersonation ile girme.

Impersonation oturumu:

```text
actorType = TENANT_IMPERSONATION
```

Bu oturum, tenant içindeki modül/permission kısıtlarını İGESA için aşabilir; fakat audit kayıtlarında platform erişimi ayrıca işaretlenir.

---

## 5. Hazır Paket Sistemi

Sistemde 3 hazır paket bulunur.

### STARTER — Servis Başlangıç

Temel servis operasyonları:

- Dashboard
- Müşteriler
- Araçlar + QR
- İş Emirleri
- Randevular
- Personel
- Bildirimler
- Araç Kabul / Inspection
- Medya
- Müşteri Portalı

### PROFESSIONAL — Servis Profesyonel

STARTER'a ek olarak:

- Bakım Planlaması
- Teklif / Proforma
- Stok
- Tedarikçiler
- Şubeler

### PREMIUM — Servis 360

PROFESSIONAL'a ek olarak:

- Cari / Tahsilat
- Raporlar
- Ayarlar
- Audit / Denetim
- tam yönetim modülleri

Yeni tenant kaydı varsayılan olarak STARTER paketinden başlar.

Eski tenantlar migration sırasında veri kaybı yaşamaması için PREMIUM pakete atanmıştır.

---

## 6. Paket Feature Sistemi

Paket seviyesi yetki enum'u:

```text
FeatureKey
```

Başlıca feature'lar:

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

İşletmeye özel feature override modeli:

```text
OrganizationFeatureOverride
```

Mantık:

```text
Paket feature'ları
+ İGESA tarafından özel açılanlar
- İGESA tarafından özel kapatılanlar
= Effective Features
```

Backend tarafında `@Feature(...)` ile kontrol edilir.

Web ve mobil menüler de `user.features` verisine göre filtrelenir.

---

## 7. Detaylı Permission Sistemi

Paket modülün açık olup olmadığını belirler.

Permission ise modülün içinde hangi işlemin yapılabileceğini belirler.

Enum:

```text
PermissionKey
```

Ana izin grupları:

### Müşteri

- CUSTOMER_VIEW
- CUSTOMER_CREATE
- CUSTOMER_UPDATE
- CUSTOMER_DELETE

### Araç

- VEHICLE_VIEW
- VEHICLE_CREATE
- VEHICLE_UPDATE
- VEHICLE_DELETE
- VEHICLE_QR

### İş Emri

- SERVICE_ORDER_VIEW
- SERVICE_ORDER_CREATE
- SERVICE_ORDER_EDIT
- SERVICE_ORDER_ASSIGN
- SERVICE_ORDER_STATUS
- SERVICE_ORDER_ITEM_MANAGE
- SERVICE_ORDER_WORKLOG

### Randevu

- APPOINTMENT_VIEW
- APPOINTMENT_MANAGE

### Teklif

- QUOTE_VIEW
- QUOTE_CREATE
- QUOTE_STATUS

### Bakım

- MAINTENANCE_VIEW
- MAINTENANCE_MANAGE

### Stok

- INVENTORY_VIEW
- INVENTORY_MANAGE

### Tedarikçi

- SUPPLIER_VIEW
- SUPPLIER_MANAGE

### Personel

- STAFF_VIEW
- STAFF_CREATE
- STAFF_UPDATE
- STAFF_PASSWORD

### Şube

- BRANCH_VIEW
- BRANCH_MANAGE

### Bildirim

- NOTIFICATION_VIEW
- NOTIFICATION_MANAGE

### Kasa

- CASHIER_VIEW
- CASHIER_COLLECT
- CASHIER_STATUS

### Rapor

- REPORTS_VIEW

### Ayarlar

- SETTINGS_VIEW
- SETTINGS_MANAGE

### Inspection

- INSPECTION_VIEW
- INSPECTION_MANAGE

### Medya

- MEDIA_VIEW
- MEDIA_UPLOAD
- MEDIA_DELETE

İşletmeye özel rol permission override modeli:

```text
OrganizationRolePermissionOverride
```

Backend'de `@Permission(...)` ile zorlanır.

Frontend'de ilgili ekran, buton veya menü mümkün olduğunca izin durumuna göre gizlenir; fakat güvenlik kaynağı her zaman backend'dir.

---

## 8. Tenant Personel Rolleri

```text
OWNER
MANAGER
SERVICE_ADVISOR
TECHNICIAN
WAREHOUSE
ACCOUNTING
```

### OWNER

- işletme kurucusu,
- varsayılan olarak tüm detay permission'lara sahiptir.

### MANAGER

- yönetici,
- varsayılan olarak tüm detay permission'lara sahiptir.

### SERVICE_ADVISOR

Tipik görevleri:

- müşteri kabul,
- müşteri oluşturma,
- araç işlemleri,
- randevu,
- iş emri,
- teklif,
- bakım koordinasyonu,
- teknisyen atama.

Varsayılan olarak kritik yönetim / finans / silme işlemleri sınırlıdır.

### TECHNICIAN

Temel amaç:

- atanmış iş emirlerini görmek,
- servis durumlarını güncellemek,
- inspection / media işlemlerine erişmek.

Teknik personelin izinli servis durumları:

```text
ACCEPTED           = Bakıma Alındı
IN_PROGRESS        = Bakım Sırası Bekliyor
PART_WAITING       = Parça Bekleniyor
QUALITY_CONTROL    = Bakım Tamamlandı
READY              = Teslimata Hazır
```

### WAREHOUSE

- stok görüntüleme,
- stok giriş/çıkış,
- parça yönetimi,
- tedarikçi yönetimi.

### ACCOUNTING

- cari,
- tahsilat,
- ödeme durumu,
- raporlama.

---

## 9. İş Emri Durumları

```text
APPOINTMENT
ARRIVED
ACCEPTED
INSPECTION
QUOTE_WAITING
APPROVED
IN_PROGRESS
PART_WAITING
QUALITY_CONTROL
READY
PAYMENT_WAITING
DELIVERED
CANCELLED
```

Türkçe karşılıkları UI tarafında mapping ile gösterilir.

İş emri ana ilişkileri:

- customer
- vehicle
- branch
- assignedTechnician
- inspections
- items
- quotes
- maintenanceRecord
- inventoryMovements
- media
- workLogs
- payments
- notifications

---

## 10. Mobil Work Log — Geliştirme Durumu

Yeni geliştirilen / devam eden yapı:

```text
ServiceOrderWorkLog
```

Amaç:

- teknisyenin yaptığı işlem notunu kaydetmek,
- kullanılan parçayı kaydetmek,
- kim yaptı / ne zaman yaptı bilgisini saklamak,
- mobil iş emri detayında zaman çizelgesi oluşturmak.

Work log tipleri:

```text
NOTE
PART_USED
```

Model alanları:

- organizationId
- serviceOrderId
- userId
- type
- note
- partId
- partName
- quantity
- createdAt

Bu bölüm henüz tüm API + mobile akışıyla tamamlanmış kabul edilmemelidir. Geliştirme sırasında migration/build/test mutlaka yeniden çalıştırılmalıdır.

---

## 11. Müşteri ve Araç Yönetimi

### Customer

Önemli alanlar:

- firstName
- lastName
- phone
- email
- taxNumber
- nationalIdHash
- nationalIdLast4
- portalEnabled
- address
- notes

T.C. Kimlik No düz metin saklanmaz.

Saklama mantığı:

- doğrulama yapılır,
- HMAC fingerprint/hash oluşturulur,
- sadece son 4 hane ayrı saklanır.

### Vehicle

Önemli alanlar:

- customerId
- plate
- vin
- brand
- model
- packageName
- modelYear
- engineType
- engineCode
- engineVolume
- fuelType
- transmission
- color
- mileage
- oilType
- oilCapacity
- tireSize
- batteryInfo
- qrToken
- qrActive

QR sistemi araç bazlı dijital bakım kartı için kullanılır.

---

## 12. Müşteri Portalı

Public route:

```text
/musteri
```

Backend route prefix:

```text
/customer-portal
```

Akış:

1. T.C. Kimlik No girilir.
2. Plaka girilir.
3. T.C. hash + araç eşleşmesi aranır.
4. Kayıtlı telefon üzerinden OTP doğrulaması başlatılır.
5. OTP doğrulanır.
6. 30 dakikalık customer portal JWT oluşturulur.
7. Kullanıcı sadece doğruladığı araç ve ilgili finans verisini görebilir.

Portalın gösterdiği ana bilgiler:

- müşteri bilgisi,
- araç bilgisi,
- cari toplam,
- ödenen,
- açık bakiye,
- ödeme hareketleri.

Development modunda OTP kodu SMS göndermek yerine test amaçlı response içinde dönebilir.

Production'da gerçek SMS entegrasyonu yapılandırılmalıdır.

---

## 13. Web Uygulaması

Klasör:

```text
apps/web
```

Teknoloji:

- React
- Vite
- React Router
- Axios

Ana route'lar:

```text
/login
/platform-login
/platform
/musteri
/qr/:token
/
```

Dashboard içindeki başlıca paneller:

- Dashboard
- Müşteriler
- Araçlar
- İş Emirleri
- Randevular
- Teklifler
- Bakım
- Stok
- Tedarikçiler
- Personel
- Şubeler
- Bildirimler
- Kasa / Tahsilat
- Raporlar
- Ayarlar
- Hesabım

---

## 14. Web Görünüm Modları

Web uygulamasında 3 görünüm modu vardır.

### Klasik

- sol menü,
- standart yönetim paneli.

### Masaüstü

- Windows benzeri masaüstü,
- büyük uygulama ikonları,
- uygulamalar klasör/pencere mantığında açılır,
- sekmeler bulunur,
- görev çubuğu bulunur,
- pencere küçült / büyüt / kapat mantığı vardır.

Masaüstü wallpaper seçenekleri:

- Sade
- Teknik
- Füme

### Çalışma Alanı

- üst yatay menü,
- geniş içerik alanı,
- kurumsal ERP görünümü.

Tema:

- Koyu
- Aydınlık

Görünüm ve tema kullanıcı bazında localStorage'da saklanır.

---

## 15. Müşteri Paneli

Bir müşteri seçildikten sonra aynı müşteri bağlamında açılan bölümler:

- Araçlar
- Bakım Planlaması
- Teklifler
- Randevular
- Cari
- İletişim

Bu sekmeler hem package feature hem de permission kontrolüne göre gösterilmelidir.

---

## 16. Mobil Personel Uygulaması

Klasör:

```text
apps/mobile
```

Teknoloji:

- Expo SDK 57
- React Native
- SecureStore
- Axios

Mobil uygulama tenant personel içindir.

Mevcut mobil ana ekranları:

- Ana Sayfa
- Müşteriler
- İşler
- Stok
- Kasa
- Araç Kabul
- Bildirimler
- Hesabım

Menü kullanıcı rolü + feature + permission bilgisine göre otomatik oluşturulur.

Örnek:

### TECHNICIAN

Öncelikli ekranlar:

- İşler
- Bildirimler
- Hesabım

### WAREHOUSE

Öncelikli ekranlar:

- Stok
- Bildirimler
- Hesabım

### ACCOUNTING

Öncelikli ekranlar:

- Kasa
- Bildirimler
- Hesabım

---

## 17. Mobil API Adresi

Android emülatör:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

Fiziksel telefon ve PC aynı ağdaysa:

```env
EXPO_PUBLIC_API_URL=http://PC_LAN_IP:3000
```

Windows Mobile Hotspot örneği:

```env
EXPO_PUBLIC_API_URL=http://192.168.137.1:3000
```

Canlı API:

```env
EXPO_PUBLIC_API_URL=https://tamir-bakim-api.onrender.com
```

Mobil uygulamada `localhost` fiziksel telefon için kullanılmamalıdır.

---

## 18. Backend API

Klasör:

```text
apps/api
```

Health endpoint:

```http
GET /health
```

Başarılı response:

```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "..."
}
```

Auth:

```text
POST /auth/register
POST /auth/login
GET  /users/me
```

Platform:

```text
POST   /platform/login
GET    /platform/me
GET    /platform/packages
GET    /platform/organizations
PATCH  /platform/organizations/:id/package
PUT    /platform/organizations/:id/features/:feature
DELETE /platform/organizations/:id/features/:feature
PUT    /platform/organizations/:id/roles/:role/permissions/:permission
PUT    /platform/organizations/:id/roles/:role/permissions
DELETE /platform/organizations/:id/roles/:role/permissions
POST   /platform/organizations/:id/impersonate
```

Customer portal:

```text
POST /customer-portal/access/start
POST /customer-portal/access/verify
GET  /customer-portal/me
```

Diğer controller'lar:

- customers
- vehicles
- appointments
- inspections
- service-orders
- quotes
- maintenance
- inventory
- suppliers
- media
- billing
- notifications
- reports
- audit
- organizations
- users
- branches
- vehicle-catalog

---

## 19. Backend Güvenlik Kuralları

Backend girişinde:

- Helmet
- CORS
- ValidationPipe
- whitelist
- transform
- forbidNonWhitelisted

Production'da Swagger varsayılan olarak kapalıdır.

CORS:

```env
CORS_ORIGINS=http://localhost:5173,https://frontend-domain
```

JWT:

```env
JWT_SECRET=...
```

Müşteri portalı için ayrı secret tercih edilir:

```env
CUSTOMER_PORTAL_JWT_SECRET=...
```

T.C. hash pepper:

```env
CUSTOMER_ID_PEPPER=...
```

---

## 20. Platform Founder Ortam Değişkenleri

```env
PLATFORM_FOUNDER_EMAIL=...
PLATFORM_FOUNDER_PASSWORD="..."
PLATFORM_FOUNDER_FIRST_NAME=...
PLATFORM_FOUNDER_LAST_NAME=...
```

Not:

> Şifrede `#` gibi karakterler varsa .env içinde mutlaka tırnak kullanılmalıdır.

Örnek:

```env
PLATFORM_FOUNDER_PASSWORD="Strong#Password"
```

Platform founder hesabı backend açılışında environment bilgileri ile senkronlanır.

---

## 21. Local Geliştirme Ortamı

Windows proje yolu:

```text
C:\Users\bilgi\OneDrive\Desktop\tamir-bakim-programi
```

Local PostgreSQL:

- PostgreSQL 17
- DB: tamir_bakim

### API

```powershell
cd "C:\Users\bilgi\OneDrive\Desktop\tamir-bakim-programi\apps\api"
npm.cmd install
npx.cmd prisma generate
npm.cmd run start:dev
```

### Web

```powershell
cd "C:\Users\bilgi\OneDrive\Desktop\tamir-bakim-programi\apps\web"
npm.cmd install
npm.cmd run dev
```

### Mobile

```powershell
cd "C:\Users\bilgi\OneDrive\Desktop\tamir-bakim-programi\apps\mobile"
npm.cmd install
npm.cmd run start -- --lan
```

---

## 22. Tam Sistem Doğrulama

Project root:

```powershell
cd "C:\Users\bilgi\OneDrive\Desktop\tamir-bakim-programi"

powershell -ExecutionPolicy Bypass -File .\verify-core-v2.ps1
```

Beklenen final:

```text
TUM OTOMATIK TESTLER BASARIYLA TAMAMLANDI
Core V2 migration/build/lint/API-health/web-build: OK
```

Ek olarak GitHub Actions:

```text
.github/workflows/core-v2-ci.yml
```

CI kapsamı:

- PostgreSQL 17 service
- npm ci
- prisma validate
- prisma generate
- prisma migrate deploy
- API production build
- API lint
- health/database smoke
- authorization smoke
- web lint
- web production build
- mobile Android bundle check

---

## 23. Git Çalışma Düzeni

Aktif branch:

```text
feature/core-workflow-v2
```

Local güncelleme:

```powershell
git pull origin feature/core-workflow-v2
```

Yeni geliştirme öncesi:

1. branch güncel mi kontrol et,
2. değişecek dosyayı oku,
3. Prisma modeli değişecekse migration oluştur,
4. backend + web + mobile etkisini birlikte değerlendir,
5. permission / feature güvenliğini kontrol et,
6. testleri çalıştır,
7. sonra deploy et.

---

## 24. Render Deployment

Canlı API:

```text
https://tamir-bakim-api.onrender.com
```

Canlı web:

```text
https://tamir-bakim-programi.onrender.com
```

API Render ayarları:

Root Directory:

```text
apps/api
```

Build:

```bash
npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

Start:

```bash
npm run start:prod
```

Önemli production env:

```env
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
SWAGGER_ENABLED=false
CORS_ORIGINS=https://tamir-bakim-programi.onrender.com
CUSTOMER_ID_PEPPER=...
CUSTOMER_PORTAL_JWT_SECRET=...
PLATFORM_FOUNDER_EMAIL=...
PLATFORM_FOUNDER_PASSWORD="..."
```

Web Render Static Site:

Root:

```text
apps/web
```

Build:

```bash
npm ci && npm run build
```

Publish:

```text
dist
```

Env:

```env
VITE_API_URL=https://tamir-bakim-api.onrender.com
```

SPA rewrite:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

---

## 25. Kritik Güvenlik Notları

1. `.env` Git'e commit edilmez.
2. Database password / URL hiçbir ekran görüntüsünde paylaşılmamalıdır.
3. JWT secret paylaşılmamalıdır.
4. T.C. Kimlik No düz metin saklanmaz.
5. Customer portal finans verisi OTP doğrulama olmadan açılmaz.
6. Backend permission kontrolü frontend gizlemesinden daha önemlidir.
7. Tenant verisi `organizationId` filtresi olmadan sorgulanmamalıdır.
8. Branch çalışanları için branch scope bozulmamalıdır.
9. Platform impersonation audit kayıtlarında izlenmelidir.
10. Production media storage konusu ayrıca ele alınmalıdır; Render ephemeral filesystem kalıcı medya için güvenli değildir.

---

## 26. Bilinen / Devam Eden İşler

Şu konular geliştirme planında veya kısmen devam etmektedir:

- mobil ServiceOrderWorkLog API ve ekran entegrasyonunun tamamlanması,
- mobil iş emrine işlem notu ekleme,
- mobil kullanılan parça kaydı,
- mobil kamera ile fotoğraf çekme ve yükleme,
- mobil araç kabul akışının güçlendirilmesi,
- push notification,
- müşteri için ayrı native mobil uygulama,
- production kalıcı medya storage (S3 / Cloudinary / benzeri),
- SMS sağlayıcısının production entegrasyonu,
- backup / monitoring,
- dependency security review.

Bu maddeler tamamlanmış gibi varsayılmamalıdır.

---

## 27. Yeni Özellik Eklerken Kontrol Listesi

Her yeni özellikte şu sorular cevaplanmalı:

1. Bu özellik hangi `FeatureKey` altında?
2. Yeni bir `PermissionKey` gerekiyor mu?
3. Hangi roller varsayılan erişim alacak?
4. Platform admin bunu açıp kapatabilecek mi?
5. Backend endpoint permission ile korunuyor mu?
6. Web route / buton / menü permission'a uyuyor mu?
7. Mobile aynı permission modelini kullanıyor mu?
8. Tenant scope doğru mu?
9. Branch scope doğru mu?
10. Audit gerektiriyor mu?
11. Prisma migration gerekiyor mu?
12. CI testine yeni senaryo eklenmeli mi?

---

## 28. Hata Ayıklama Sırası

Bir özellik çalışmıyorsa şu sırayla bak:

### 1. API ayakta mı?

```text
/health
```

### 2. Kullanıcı login olabiliyor mu?

```text
POST /auth/login
GET /users/me
```

### 3. /users/me içindeki alanlar

Kontrol et:

```text
role
organizationId
branchId
features
permissions
actorType
```

### 4. Paket feature açık mı?

Platform panelinden veya effectiveFeatures'dan kontrol et.

### 5. Permission açık mı?

effectiveRolePermissions veya `user.permissions` kontrol et.

### 6. Controller'da @Feature / @Permission var mı?

### 7. Service tenant/branch scope doğru mu?

### 8. Frontend yanlış endpoint mi çağırıyor?

### 9. Prisma schema ile migration uyumlu mu?

### 10. Local build / CI sonucu ne?

---

## 29. Yazılımcı İçin Değişmez Kurallar

- Veritabanı yapısını görmeden model uydurma.
- DTO alanlarını tahmin etme; dosyayı aç.
- Yeni endpoint eklerken mevcut controller/service kalıbını takip et.
- Tenant izolasyonunu asla bozma.
- Permission sadece UI seviyesinde uygulanmamalı.
- Platform kullanıcılarını tenant User modeliyle karıştırma.
- Customer portal JWT'sini personel JWT'si gibi kullanma.
- T.C. Kimlik No gibi hassas verileri loglama.
- Migration yazmadan production schema'yı değiştirme.
- Çalışmayan değişikliği Render'a göndermeden önce local ve CI test et.
- Mevcut data migration etkisini düşün.
- Kullanıcının mevcut işletme verilerini silme / resetleme işlemini açık onay almadan yapma.

---

## 30. Sistemin Kısa Zihinsel Modeli

```text
İGESA PLATFORM
   |
   +-- Organization A
   |     |
   |     +-- Package
   |     +-- Feature Overrides
   |     +-- Role Permission Overrides
   |     +-- Branches
   |     +-- Staff
   |     +-- Customers
   |     +-- Vehicles
   |     +-- Service Orders
   |     +-- Inventory
   |     +-- Finance
   |
   +-- Organization B
         |
         +-- tamamen ayrı tenant verisi
```

Yetki hesabı:

```text
ROLE
+
PACKAGE FEATURES
+
ORGANIZATION FEATURE OVERRIDE
+
ROLE PERMISSION OVERRIDE
=
KULLANICININ GERÇEK ERİŞİMİ
```

Customer portal:

```text
T.C. + PLAKA
   ↓
OTP
   ↓
KISA SÜRELİ PORTAL JWT
   ↓
SADECE DOĞRULANAN ARAÇ
   ↓
BİLGİ + CARİ + ÖDEME
```

---

## 31. Destek Veren Yazılımcının İlk Yapacağı Şey

Bir bug / özellik talebi geldiğinde direkt kod yazmaya başlama.

Önce:

1. ilgili controller'ı oku,
2. ilgili service'i oku,
3. DTO'yu oku,
4. Prisma modelini kontrol et,
5. web/mobile çağrısını kontrol et,
6. feature ve permission ilişkisini doğrula,
7. sonra değişiklik yap.

Bu sistemin en kritik noktaları:

- tenant isolation,
- package entitlement,
- role permission,
- platform impersonation,
- customer portal security.

Bu beş alanı bozan değişiklik kabul edilmemelidir.

---

## 32. Son Durum

Çalışan ana sistem:

- API
- PostgreSQL
- Web
- Platform admin
- 3 paket
- feature sistemi
- detay permission sistemi
- customer portal
- QR vehicle card
- role based staff
- React web dashboard
- Expo mobile staff app
- CI validation

Devam eden ana faz:

> Mobil servis workflow'unu zenginleştirme ve ardından müşteri native mobil uygulamasına geçiş.

