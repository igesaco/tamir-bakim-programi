ALTER TABLE "ServiceOrderItem"
ADD COLUMN "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
ADD COLUMN "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "grossTotal" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "ServiceOrderItem"
SET
  "vatAmount" = ROUND(("totalPrice" * 20 / 100)::numeric, 2),
  "grossTotal" = ROUND(("totalPrice" * 1.20)::numeric, 2)
WHERE "grossTotal" = 0;
