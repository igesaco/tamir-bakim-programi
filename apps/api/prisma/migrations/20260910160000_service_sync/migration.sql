ALTER TYPE "PermissionKey" ADD VALUE IF NOT EXISTS 'SERVICE_ORDER_ITEM_COMPLETE';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'SETTLED';
ALTER TABLE "ServiceOrder" ADD COLUMN "requestKey" TEXT, ADD COLUMN "requestHash" TEXT, ADD COLUMN "creditDeliveryReason" TEXT;
CREATE UNIQUE INDEX "ServiceOrder_organizationId_requestKey_key" ON "ServiceOrder"("organizationId", "requestKey");
ALTER TABLE "Payment" ADD COLUMN "requestKey" TEXT, ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "Payment_organizationId_requestKey_key" ON "Payment"("organizationId", "requestKey");
ALTER TABLE "ServiceOrderItem" ADD COLUMN "stockIssued" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "approvedQuoteId" TEXT;
ALTER TABLE "QuoteItem" ADD COLUMN "serviceOrderItemId" TEXT;
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_serviceOrderItemId_fkey" FOREIGN KEY ("serviceOrderItemId") REFERENCES "ServiceOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "ServiceOrderItem" AS item SET "stockIssued" = true WHERE EXISTS (
 SELECT 1 FROM "InventoryMovement" AS m WHERE m."serviceOrderId"=item."serviceOrderId" AND m.type='OUT' AND m.note='SERVICE_ORDER_ITEM:'||item.id
) AND NOT EXISTS (SELECT 1 FROM "InventoryMovement" AS r WHERE r.note='SERVICE_ORDER_ITEM_RETURN:'||item.id AND r.type='RETURN');

ALTER TABLE "Media" ADD COLUMN "requestKey" TEXT;
CREATE UNIQUE INDEX "Media_organizationId_requestKey_key" ON "Media"("organizationId", "requestKey");

ALTER TABLE "ServiceOrder" ADD COLUMN "maintenancePlanIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Preserve existing records; reject new aliases of an existing plate, including legacy spaced plates.
CREATE OR REPLACE FUNCTION normalize_vehicle_plate_write() RETURNS trigger AS $$
BEGIN
  NEW."plate" := upper(regexp_replace(translate(NEW."plate", 'İı', 'II'), '[[:space:]]', '', 'g'));
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW."organizationId", 0));
  IF EXISTS (SELECT 1 FROM "Vehicle" v WHERE v."organizationId" = NEW."organizationId" AND v.id <> NEW.id
    AND upper(regexp_replace(translate(v.plate, 'İı', 'II'), '[[:space:]]', '', 'g')) = NEW.plate) THEN
    RAISE EXCEPTION 'Vehicle plate already exists' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER vehicle_plate_write BEFORE INSERT OR UPDATE OF "plate", "organizationId" ON "Vehicle"
FOR EACH ROW EXECUTE FUNCTION normalize_vehicle_plate_write();

CREATE TABLE "MediaObject" (
  "mediaId" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaObject_pkey" PRIMARY KEY ("mediaId")
);
ALTER TABLE "MediaObject" ADD CONSTRAINT "MediaObject_mediaId_fkey"
FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Vehicle" ADD COLUMN "mileageUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
