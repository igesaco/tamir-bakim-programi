ALTER TYPE "PermissionKey"
ADD VALUE IF NOT EXISTS 'SERVICE_ORDER_WORKLOG';

CREATE TYPE "ServiceOrderWorkLogType" AS ENUM (
  'NOTE',
  'PART_USED'
);

CREATE TABLE "ServiceOrderWorkLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "serviceOrderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "ServiceOrderWorkLogType" NOT NULL DEFAULT 'NOTE',
  "note" TEXT,
  "partId" TEXT,
  "partName" TEXT,
  "quantity" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServiceOrderWorkLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceOrderWorkLog_organizationId_idx"
ON "ServiceOrderWorkLog"("organizationId");

CREATE INDEX "ServiceOrderWorkLog_serviceOrderId_idx"
ON "ServiceOrderWorkLog"("serviceOrderId");

CREATE INDEX "ServiceOrderWorkLog_userId_idx"
ON "ServiceOrderWorkLog"("userId");

CREATE INDEX "ServiceOrderWorkLog_partId_idx"
ON "ServiceOrderWorkLog"("partId");

ALTER TABLE "ServiceOrderWorkLog"
ADD CONSTRAINT "ServiceOrderWorkLog_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "Organization"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ServiceOrderWorkLog"
ADD CONSTRAINT "ServiceOrderWorkLog_serviceOrderId_fkey"
FOREIGN KEY ("serviceOrderId")
REFERENCES "ServiceOrder"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ServiceOrderWorkLog"
ADD CONSTRAINT "ServiceOrderWorkLog_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "ServiceOrderWorkLog"
ADD CONSTRAINT "ServiceOrderWorkLog_partId_fkey"
FOREIGN KEY ("partId")
REFERENCES "Part"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
