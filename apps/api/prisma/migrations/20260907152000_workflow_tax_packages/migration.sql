-- Add VAT totals to quotes
ALTER TABLE "Quote"
ADD COLUMN "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "QuoteItem"
ADD COLUMN "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
ADD COLUMN "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "grossTotal" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Ready-made maintenance packages
CREATE TABLE "MaintenancePackage" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MaintenancePackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenancePackageItem" (
  "id" TEXT NOT NULL,
  "maintenancePackageId" TEXT NOT NULL,
  "type" "ServiceItemType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MaintenancePackageItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaintenancePackage_organizationId_name_key"
ON "MaintenancePackage"("organizationId", "name");

CREATE INDEX "MaintenancePackage_organizationId_idx"
ON "MaintenancePackage"("organizationId");

CREATE INDEX "MaintenancePackageItem_maintenancePackageId_idx"
ON "MaintenancePackageItem"("maintenancePackageId");

ALTER TABLE "MaintenancePackage"
ADD CONSTRAINT "MaintenancePackage_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "Organization"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "MaintenancePackageItem"
ADD CONSTRAINT "MaintenancePackageItem_maintenancePackageId_fkey"
FOREIGN KEY ("maintenancePackageId")
REFERENCES "MaintenancePackage"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
