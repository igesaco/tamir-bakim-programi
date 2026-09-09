ALTER TABLE "Media"
ADD COLUMN IF NOT EXISTS "customerVisible" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Media"
SET "customerVisible" = true
WHERE "type" IN ('VEHICLE', 'ACCEPTANCE', 'DAMAGE', 'ODOMETER')
  AND "serviceOrderId" IS NOT NULL;
