CREATE TYPE "PermissionKey" AS ENUM (
  'CUSTOMER_VIEW',
  'CUSTOMER_CREATE',
  'CUSTOMER_UPDATE',
  'CUSTOMER_DELETE',
  'VEHICLE_VIEW',
  'VEHICLE_CREATE',
  'VEHICLE_UPDATE',
  'VEHICLE_DELETE',
  'VEHICLE_QR',
  'SERVICE_ORDER_VIEW',
  'SERVICE_ORDER_CREATE',
  'SERVICE_ORDER_EDIT',
  'SERVICE_ORDER_ASSIGN',
  'SERVICE_ORDER_STATUS',
  'SERVICE_ORDER_ITEM_MANAGE',
  'APPOINTMENT_VIEW',
  'APPOINTMENT_MANAGE',
  'QUOTE_VIEW',
  'QUOTE_CREATE',
  'QUOTE_STATUS',
  'MAINTENANCE_VIEW',
  'MAINTENANCE_MANAGE',
  'INVENTORY_VIEW',
  'INVENTORY_MANAGE',
  'SUPPLIER_VIEW',
  'SUPPLIER_MANAGE',
  'STAFF_VIEW',
  'STAFF_CREATE',
  'STAFF_UPDATE',
  'STAFF_PASSWORD',
  'BRANCH_VIEW',
  'BRANCH_MANAGE',
  'NOTIFICATION_VIEW',
  'NOTIFICATION_MANAGE',
  'CASHIER_VIEW',
  'CASHIER_COLLECT',
  'CASHIER_STATUS',
  'REPORTS_VIEW',
  'SETTINGS_VIEW',
  'SETTINGS_MANAGE',
  'INSPECTION_VIEW',
  'INSPECTION_MANAGE',
  'MEDIA_VIEW',
  'MEDIA_UPLOAD',
  'MEDIA_DELETE'
);

CREATE TABLE "OrganizationRolePermissionOverride" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "permission" "PermissionKey" NOT NULL,
  "allowed" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationRolePermissionOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationRolePermissionOverride_organizationId_role_permission_key"
ON "OrganizationRolePermissionOverride"("organizationId", "role", "permission");

CREATE INDEX "OrganizationRolePermissionOverride_organizationId_role_idx"
ON "OrganizationRolePermissionOverride"("organizationId", "role");

ALTER TABLE "OrganizationRolePermissionOverride"
ADD CONSTRAINT "OrganizationRolePermissionOverride_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "Organization"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
