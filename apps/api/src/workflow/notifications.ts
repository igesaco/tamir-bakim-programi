import { NotificationChannel, NotificationStatus, Prisma, UserRole } from '@prisma/client';

export async function notifyOffice(tx: Prisma.TransactionClient, organizationId: string,
  branchId: string, serviceOrderId: string, title: string, message: string, warehouse = false) {
  const users = await tx.user.findMany({ where: { organizationId, active: true,
    role: { in: [UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTING, UserRole.SERVICE_ADVISOR,
      ...(warehouse ? [UserRole.WAREHOUSE] : [])] },
    OR: [{ branchId }, { branchId: null }],
  }, select: { id: true } });
  if (users.length) await tx.notification.createMany({ data: users.map(user => ({ organizationId,
    branchId, serviceOrderId, userId: user.id, title, message,
    channel: NotificationChannel.IN_APP, status: NotificationStatus.PENDING })) });
}
