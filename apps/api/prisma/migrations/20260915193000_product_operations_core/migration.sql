CREATE TYPE "WorkSessionStatus" AS ENUM ('ACTIVE', 'STOPPED');
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED');
CREATE TYPE "ProcurementRequestStatus" AS ENUM ('OPEN', 'ORDERED', 'RECEIVED', 'CANCELLED');

ALTER TABLE "Appointment"
ADD COLUMN "assignedTechnicianId" TEXT,
ADD COLUMN "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 60;

ALTER TABLE "Quote"
ADD COLUMN "approvedTotal" DECIMAL(12,2);

ALTER TABLE "QuoteItem"
ADD COLUMN "decidedAt" TIMESTAMP(3),
ADD COLUMN "warrantyMonths" INTEGER,
ADD COLUMN "warrantyKm" INTEGER;

ALTER TABLE "ServiceOrderItem"
ADD COLUMN "warrantyMonths" INTEGER,
ADD COLUMN "warrantyKm" INTEGER,
ADD COLUMN "warrantyStartedAt" TIMESTAMP(3),
ADD COLUMN "warrantyExpiresAt" TIMESTAMP(3),
ADD COLUMN "warrantyClaimOfId" TEXT;

CREATE TABLE "ServiceOrderWorkSession" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "serviceOrderItemId" TEXT,
  "technicianId" TEXT NOT NULL,
  "status" "WorkSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "stoppedAt" TIMESTAMP(3),
  "durationMinutes" INTEGER,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceOrderWorkSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryReservation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "inventoryId" TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "serviceOrderItemId" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProcurementRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "serviceOrderItemId" TEXT,
  "partId" TEXT,
  "partName" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "status" "ProcurementRequestStatus" NOT NULL DEFAULT 'OPEN',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcurementRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appointment_assignedTechnicianId_startAt_idx" ON "Appointment"("assignedTechnicianId", "startAt");
CREATE INDEX "ServiceOrderItem_warrantyClaimOfId_idx" ON "ServiceOrderItem"("warrantyClaimOfId");
CREATE INDEX "ServiceOrderWorkSession_organizationId_idx" ON "ServiceOrderWorkSession"("organizationId");
CREATE INDEX "ServiceOrderWorkSession_serviceOrderId_idx" ON "ServiceOrderWorkSession"("serviceOrderId");
CREATE INDEX "ServiceOrderWorkSession_technicianId_status_idx" ON "ServiceOrderWorkSession"("technicianId", "status");
CREATE UNIQUE INDEX "InventoryReservation_serviceOrderItemId_key" ON "InventoryReservation"("serviceOrderItemId");
CREATE INDEX "InventoryReservation_organizationId_idx" ON "InventoryReservation"("organizationId");
CREATE INDEX "InventoryReservation_branchId_inventoryId_status_idx" ON "InventoryReservation"("branchId", "inventoryId", "status");
CREATE INDEX "InventoryReservation_serviceOrderId_idx" ON "InventoryReservation"("serviceOrderId");
CREATE INDEX "ProcurementRequest_organizationId_idx" ON "ProcurementRequest"("organizationId");
CREATE INDEX "ProcurementRequest_branchId_status_idx" ON "ProcurementRequest"("branchId", "status");
CREATE INDEX "ProcurementRequest_serviceOrderId_idx" ON "ProcurementRequest"("serviceOrderId");
CREATE INDEX "ProcurementRequest_partId_idx" ON "ProcurementRequest"("partId");

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderItem" ADD CONSTRAINT "ServiceOrderItem_warrantyClaimOfId_fkey" FOREIGN KEY ("warrantyClaimOfId") REFERENCES "ServiceOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderWorkSession" ADD CONSTRAINT "ServiceOrderWorkSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderWorkSession" ADD CONSTRAINT "ServiceOrderWorkSession_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderWorkSession" ADD CONSTRAINT "ServiceOrderWorkSession_serviceOrderItemId_fkey" FOREIGN KEY ("serviceOrderItemId") REFERENCES "ServiceOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderWorkSession" ADD CONSTRAINT "ServiceOrderWorkSession_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_serviceOrderItemId_fkey" FOREIGN KEY ("serviceOrderItemId") REFERENCES "ServiceOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_serviceOrderItemId_fkey" FOREIGN KEY ("serviceOrderItemId") REFERENCES "ServiceOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;
