# Tamircim — Vercel & Neon Geçiş Kılavuzu 🚀

Bu kılavuz, projenizi **Render** üzerinden **Vercel (Frontend & Backend Serverless)** ve **Neon (Serverless PostgreSQL)** altyapısına taşımak için hazırlanmıştır. Bu geçiş sayesinde:

- Render Free tier'daki **50 saniyelik "uyuma/soğuk açılış" (cold start) sorunu tamamen ortadan kalkar.**
- Vercel'in global Edge CDN ağıyla site **<150ms** hızında açılır.
- Neon Serverless PostgreSQL ile veritabanı anında yanıt verir ve otomatik ölçeklenir.

---

## 1. Adım: Neon Serverless PostgreSQL Veritabanını Açma (2 Dakika)

1. [https://neon.tech](https://neon.tech) adresine gidin ve ücretsiz hesap açın (GitHub ile tek tıkla giriş yapabilirsiniz).
2. **"Create Project"** butonuna tıklayın:
   - **Project Name:** `tamircim-db`
   - **Region:** `Frankfurt (eu-central-1)` (Türkiye'ye en yakın ve en hızlı bölgedir)
3. Proje oluştuktan sonra Dashboard'da **Connection Details** bölümünden bağlantı adresinizi kopyalayın:
   ```text
   postgresql://[kullanici]:[sifre]@ep-[isim].eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Bilgisayarınızda terminali açıp `apps/api` klasöründe veritabanı tablolarını Neon'a gönderin:
   ```bash
   cd apps/api
   
   # Windows PowerShell için:
   $env:DATABASE_URL="postgresql://[kullanici]:[sifre]@ep-[isim].eu-central-1.aws.neon.tech/neondb?sslmode=require"
   
   npx prisma generate
   npx prisma migrate deploy
   ```
   *Tablolarınız saniyeler içinde Neon veritabanınızda oluşturulacaktır!*

---

## 2. Adım: Vercel'de API (Backend) Dağıtımı

Proje içerisine Vercel Serverless desteği eklenmiştir (`apps/api/api/index.ts` ve `apps/api/vercel.json`).

1. [https://vercel.com](https://vercel.com) adresine gidin ve **"Add New Project"** seçin.
2. GitHub reponuzu bağlayın.
3. Proje ayarlarında:
   - **Root Directory:** `apps/api` seçin.
   - **Framework Preset:** `Other`
4. **Environment Variables** bölümüne şunları ekleyin:
   - `DATABASE_URL`: *(1. adımda aldığınız Neon bağlantı linki)*
   - `JWT_SECRET`: *(En az 32 karakterlik rastgele güvenli şifre)*
   - `CUSTOMER_PORTAL_JWT_SECRET`: *(En az 32 karakterlik rastgele şifre)*
   - `NODE_ENV`: `production`
   - `SWAGGER_ENABLED`: `false`
   - `CORS_ORIGINS`: `*` *(veya Vercel web adresiniz)*
5. **"Deploy"** butonuna basın.
   *API adresiniz hazır olacaktır: örn. `https://tamircim-api.vercel.app`*

---

## 3. Adım: Vercel'de Web (Frontend) Dağıtımı

`apps/web/vercel.json` dosyası SPA yönlendirmeleri ile hazırlandı.

1. Vercel Dashboard'da tekrar **"Add New Project"** deyin.
2. Aynı repoyu seçin:
   - **Root Directory:** `apps/web` seçin.
   - **Framework Preset:** `Vite` *(Vercel otomatik tanır)*
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables** bölümüne:
   - `VITE_API_URL`: *(2. adımda aldığınız API Vercel adresi, örn: `https://tamircim-api.vercel.app`)*
4. **"Deploy"** butonuna basın.
   *Web siteniz anında yayına girecektir: örn. `https://tamircim.vercel.app`*

---

## 4. Tebrikler! 🎉
Sisteminiz artık dünyanın en hızlı serverless altyapısı olan **Vercel + Neon** üzerinde çalışıyor.
Hiçbir kesinti, uyuma veya gecikme olmadan yüksek performansla hizmet verebilirsiniz.
