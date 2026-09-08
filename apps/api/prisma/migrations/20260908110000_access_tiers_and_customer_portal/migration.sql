CREATE TYPE "PlatformRole" AS ENUM ('FOUNDER', 'ADMIN', 'SUPPORT');

CREATE TYPE "FeatureKey" AS ENUM (
  'DASHBOARD',
  'CUSTOMERS',
  'VEHICLES_QR',
  'SERVICE_ORDERS',
  'APPOINTMENTS',
  'MAINTENANCE',
  'QUOTES',
  'INVENTORY',
  'SUPPLIERS',
  'STAFF',
  'BRANCHES',
  'NOTIFICATIONS',
  'CASHIER',
  'REPORTS',
  'SETTINGS',
  'INSPECTIONS',
  'MEDIA',
  'CUSTOMER_PORTAL',
  'AUDIT'
);

CREATE TABLE "PlatformUser" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "PlatformRole" NOT NULL DEFAULT 'ADMIN',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "tokenVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformUser_email_key"
ON "PlatformUser"("email");

CREATE TABLE "ServicePackage" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "features" "FeatureKey"[] NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServicePackage_code_key"
ON "ServicePackage"("code");

CREATE TABLE "OrganizationFeatureOverride" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "feature" "FeatureKey" NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationFeatureOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationFeatureOverride_organizationId_feature_key"
ON "OrganizationFeatureOverride"("organizationId", "feature");

CREATE INDEX "OrganizationFeatureOverride_organizationId_idx"
ON "OrganizationFeatureOverride"("organizationId");

ALTER TABLE "OrganizationFeatureOverride"
ADD CONSTRAINT "OrganizationFeatureOverride_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "Organization"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

INSERT INTO "ServicePackage" (
  "id",
  "code",
  "name",
  "description",
  "features",
  "sortOrder",
  "updatedAt"
)
VALUES
(
  'package_starter',
  'STARTER',
  'Servis Başlangıç',
  'Müşteri, araç, QR, randevu ve temel servis operasyonları.',
  ARRAY[
    'DASHBOARD'::"FeatureKey",
    'CUSTOMERS'::"FeatureKey",
    'VEHICLES_QR'::"FeatureKey",
    'SERVICE_ORDERS'::"FeatureKey",
    'APPOINTMENTS'::"FeatureKey",
    'NOTIFICATIONS'::"FeatureKey",
    'INSPECTIONS'::"FeatureKey",
    'MEDIA'::"FeatureKey"
  ],
  10,
  CURRENT_TIMESTAMP
),
(
  'package_professional',
  'PROFESSIONAL',
  'Servis Profesyonel',
  'Başlangıç paketine ek teklif, bakım, stok, tedarikçi, personel ve şube yönetimi.',
  ARRAY[
    'DASHBOARD'::"FeatureKey",
    'CUSTOMERS'::"FeatureKey",
    'VEHICLES_QR'::"FeatureKey",
    'SERVICE_ORDERS'::"FeatureKey",
    'APPOINTMENTS'::"FeatureKey",
    'NOTIFICATIONS'::"FeatureKey",
    'INSPECTIONS'::"FeatureKey",
    'MEDIA'::"FeatureKey",
    'MAINTENANCE'::"FeatureKey",
    'QUOTES'::"FeatureKey",
    'INVENTORY'::"FeatureKey",
    'SUPPLIERS'::"FeatureKey",
    'STAFF'::"FeatureKey",
    'BRANCHES'::"FeatureKey"
  ],
  20,
  CURRENT_TIMESTAMP
),
(
  'package_premium',
  'PREMIUM',
  'Servis 360',
  'Tüm servis operasyonları, cari, tahsilat, raporlama, müşteri portalı ve tam yönetim.',
  ARRAY[
    'DASHBOARD'::"FeatureKey",
    'CUSTOMERS'::"FeatureKey",
    'VEHICLES_QR'::"FeatureKey",
    'SERVICE_ORDERS'::"FeatureKey",
    'APPOINTMENTS'::"FeatureKey",
    'NOTIFICATIONS'::"FeatureKey",
    'INSPECTIONS'::"FeatureKey",
    'MEDIA'::"FeatureKey",
    'MAINTENANCE'::"FeatureKey",
    'QUOTES'::"FeatureKey",
    'INVENTORY'::"FeatureKey",
    'SUPPLIERS'::"FeatureKey",
    'STAFF'::"FeatureKey",
    'BRANCHES'::"FeatureKey",
    'CASHIER'::"FeatureKey",
    'REPORTS'::"FeatureKey",
    'SETTINGS'::"FeatureKey",
    'CUSTOMER_PORTAL'::"FeatureKey",
    'AUDIT'::"FeatureKey"
  ],
  30,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "Organization"
ADD COLUMN "packageId" TEXT;

UPDATE "Organization"
SET "packageId" = 'package_premium'
WHERE "packageId" IS NULL;

ALTER TABLE "Organization"
ADD CONSTRAINT "Organization_packageId_fkey"
FOREIGN KEY ("packageId")
REFERENCES "ServicePackage"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Customer"
ADD COLUMN "nationalIdHash" TEXT,
ADD COLUMN "nationalIdLast4" TEXT,
ADD COLUMN "portalEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Customer_nationalIdHash_idx"
ON "Customer"("nationalIdHash");

CREATE TABLE "CustomerPortalChallenge" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerPortalChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerPortalChallenge_customerId_idx"
ON "CustomerPortalChallenge"("customerId");

CREATE INDEX "CustomerPortalChallenge_vehicleId_idx"
ON "CustomerPortalChallenge"("vehicleId");

CREATE INDEX "CustomerPortalChallenge_expiresAt_idx"
ON "CustomerPortalChallenge"("expiresAt");

ALTER TABLE "CustomerPortalChallenge"
ADD CONSTRAINT "CustomerPortalChallenge_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "Customer"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CustomerPortalChallenge"
ADD CONSTRAINT "CustomerPortalChallenge_vehicleId_fkey"
FOREIGN KEY ("vehicleId")
REFERENCES "Vehicle"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
