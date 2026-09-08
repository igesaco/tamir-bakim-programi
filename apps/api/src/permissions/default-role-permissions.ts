import {
  PermissionKey,
  UserRole,
} from '@prisma/client';

const allPermissions =
  Object.values(
    PermissionKey,
  );

export const DEFAULT_ROLE_PERMISSIONS: Record<
  UserRole,
  PermissionKey[]
> = {
  [UserRole.OWNER]:
    allPermissions,

  [UserRole.MANAGER]:
    allPermissions,

  [UserRole.SERVICE_ADVISOR]: [
    PermissionKey.CUSTOMER_VIEW,
    PermissionKey.CUSTOMER_CREATE,
    PermissionKey.CUSTOMER_UPDATE,

    PermissionKey.VEHICLE_VIEW,
    PermissionKey.VEHICLE_CREATE,
    PermissionKey.VEHICLE_UPDATE,
    PermissionKey.VEHICLE_QR,

    PermissionKey.SERVICE_ORDER_VIEW,
    PermissionKey.SERVICE_ORDER_CREATE,
    PermissionKey.SERVICE_ORDER_EDIT,
    PermissionKey.SERVICE_ORDER_ASSIGN,
    PermissionKey.SERVICE_ORDER_STATUS,
    PermissionKey.SERVICE_ORDER_WORKLOG,
    PermissionKey.SERVICE_ORDER_ITEM_MANAGE,

    PermissionKey.APPOINTMENT_VIEW,
    PermissionKey.APPOINTMENT_MANAGE,

    PermissionKey.QUOTE_VIEW,
    PermissionKey.QUOTE_CREATE,
    PermissionKey.QUOTE_STATUS,

    PermissionKey.MAINTENANCE_VIEW,
    PermissionKey.MAINTENANCE_MANAGE,

    PermissionKey.INSPECTION_VIEW,
    PermissionKey.INSPECTION_MANAGE,

    PermissionKey.MEDIA_VIEW,
    PermissionKey.MEDIA_UPLOAD,

    PermissionKey.NOTIFICATION_VIEW,
  ],

  [UserRole.TECHNICIAN]: [
    PermissionKey.SERVICE_ORDER_VIEW,
    PermissionKey.SERVICE_ORDER_STATUS,
    PermissionKey.SERVICE_ORDER_WORKLOG,

    PermissionKey.INSPECTION_VIEW,

    PermissionKey.MEDIA_VIEW,
    PermissionKey.MEDIA_UPLOAD,
  ],

  [UserRole.WAREHOUSE]: [
    PermissionKey.INVENTORY_VIEW,
    PermissionKey.INVENTORY_MANAGE,
    PermissionKey.SUPPLIER_VIEW,
    PermissionKey.SUPPLIER_MANAGE,
  ],

  [UserRole.ACCOUNTING]: [
    PermissionKey.CUSTOMER_VIEW,
    PermissionKey.CASHIER_VIEW,
    PermissionKey.CASHIER_COLLECT,
    PermissionKey.CASHIER_STATUS,
    PermissionKey.REPORTS_VIEW,
  ],
};

export function defaultPermissionsForRole(
  role: UserRole,
) {
  return [
    ...(
      DEFAULT_ROLE_PERMISSIONS[
        role
      ] ?? []
    ),
  ];
}
