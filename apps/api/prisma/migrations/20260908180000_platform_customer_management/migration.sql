ALTER TABLE "Organization"
ADD COLUMN "defaultWallpaper" TEXT NOT NULL DEFAULT 'soft',
ADD COLUMN "contactPersonName" TEXT,
ADD COLUMN "contactPersonPhone" TEXT,
ADD COLUMN "platformNotes" TEXT,
ADD COLUMN "monthlyFee" DECIMAL(12,2) NOT NULL DEFAULT 0;

CREATE TYPE "PlatformLedgerType" AS ENUM ('DEBIT', 'CREDIT');

CREATE TABLE "PlatformLedgerEntry" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" "PlatformLedgerType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "description" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlatformLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformLedgerEntry_organizationId_idx"
ON "PlatformLedgerEntry"("organizationId");

CREATE INDEX "PlatformLedgerEntry_occurredAt_idx"
ON "PlatformLedgerEntry"("occurredAt");

ALTER TABLE "PlatformLedgerEntry"
ADD CONSTRAINT "PlatformLedgerEntry_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "Organization"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
