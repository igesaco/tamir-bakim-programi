-- Online test accounts for the current pre-production dataset.
-- Passwords are stored only as bcrypt hashes.

INSERT INTO "Organization" (
  "id",
  "name",
  "address",
  "phone",
  "whatsappPhone",
  "email",
  "active",
  "packageId",
  "createdAt",
  "updatedAt"
)
VALUES (
  'demo_org_sanayici',
  'Sanayici Test Servisi',
  'Mardin / Kızıltepe',
  '04825550000',
  '905555550000',
  'servis.test@tamirbakim.app',
  TRUE,
  'package_premium',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "address" = EXCLUDED."address",
  "phone" = EXCLUDED."phone",
  "whatsappPhone" = EXCLUDED."whatsappPhone",
  "email" = EXCLUDED."email",
  "active" = TRUE,
  "packageId" = 'package_premium',
  "updatedAt" = NOW();

INSERT INTO "Branch" (
  "id",
  "organizationId",
  "name",
  "phone",
  "address",
  "city",
  "active",
  "createdAt",
  "updatedAt"
)
VALUES (
  'demo_branch_merkez',
  'demo_org_sanayici',
  'Merkez',
  '04825550000',
  'Mardin / Kızıltepe',
  'Kızıltepe',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE
SET
  "active" = TRUE,
  "updatedAt" = NOW();

INSERT INTO "User" (
  "id",
  "organizationId",
  "branchId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "passwordHash",
  "tokenVersion",
  "role",
  "active",
  "createdAt",
  "updatedAt"
)
VALUES (
  'demo_user_sanayici',
  'demo_org_sanayici',
  'demo_branch_merkez',
  'Sanayici',
  'Test',
  'sanayici.test@tamirbakim.app',
  '05555550002',
  '$2b$12$lB7iXH9OkbyJ1vcNQeD2HO.WHiZfhAJz2y4gh4GXg1GOnkCsK.Gv.',
  0,
  'OWNER',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE
SET
  "organizationId" = 'demo_org_sanayici',
  "branchId" = 'demo_branch_merkez',
  "firstName" = 'Sanayici',
  "lastName" = 'Test',
  "phone" = '05555550002',
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = 'OWNER',
  "active" = TRUE,
  "updatedAt" = NOW();

INSERT INTO "Customer" (
  "id",
  "organizationId",
  "branchId",
  "firstName",
  "lastName",
  "phone",
  "email",
  "portalEnabled",
  "createdAt",
  "updatedAt"
)
VALUES (
  'demo_customer_musteri',
  'demo_org_sanayici',
  'demo_branch_merkez',
  'Müşteri',
  'Test',
  '05555550101',
  'musteri.test@tamirbakim.app',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE
SET
  "phone" = '05555550101',
  "email" = 'musteri.test@tamirbakim.app',
  "portalEnabled" = TRUE,
  "updatedAt" = NOW();

INSERT INTO "Vehicle" (
  "id",
  "organizationId",
  "branchId",
  "customerId",
  "plate",
  "brand",
  "model",
  "modelYear",
  "fuelType",
  "transmission",
  "mileage",
  "qrToken",
  "qrActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  'demo_vehicle_musteri',
  'demo_org_sanayici',
  'demo_branch_merkez',
  'demo_customer_musteri',
  '47TEST01',
  'Renault',
  'Megane',
  2022,
  'Dizel',
  'Otomatik',
  125000,
  'demo-bakim-karti-47test01',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE
SET
  "customerId" = 'demo_customer_musteri',
  "plate" = '47TEST01',
  "brand" = 'Renault',
  "model" = 'Megane',
  "modelYear" = 2022,
  "fuelType" = 'Dizel',
  "transmission" = 'Otomatik',
  "mileage" = 125000,
  "qrToken" = 'demo-bakim-karti-47test01',
  "qrActive" = TRUE,
  "updatedAt" = NOW();

INSERT INTO "PlatformUser" (
  "id",
  "firstName",
  "lastName",
  "email",
  "passwordHash",
  "role",
  "active",
  "tokenVersion",
  "createdAt",
  "updatedAt"
)
VALUES (
  'demo_platform_founder',
  'Kurucu',
  'Test',
  'kurucu.test@tamirbakim.app',
  '$2b$12$p9yH/FZjj2FnezX98Zs5N.iLdCPgGW/x/.m2bUPdLN6LCmrfFUYIW',
  'FOUNDER',
  TRUE,
  0,
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE
SET
  "firstName" = 'Kurucu',
  "lastName" = 'Test',
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = 'FOUNDER',
  "active" = TRUE,
  "updatedAt" = NOW();
