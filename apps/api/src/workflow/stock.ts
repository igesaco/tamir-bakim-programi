import { BadRequestException } from '@nestjs/common';
import { InventoryMovementType, Prisma, ServiceOrderItem } from '@prisma/client';

export async function issueItem(tx: Prisma.TransactionClient, organizationId: string, branchId: string,
  item: ServiceOrderItem, userId: string) {
  if (!item.partId || item.stockIssued) return;
  const changed = await tx.inventory.updateMany({ where: { organizationId, branchId, partId: item.partId,
    quantity: { gte: item.quantity } }, data: { quantity: { decrement: item.quantity } } });
  if (changed.count !== 1) throw new BadRequestException(`${item.name} için yeterli stok yok.`);
  await tx.serviceOrderItem.update({ where: { id: item.id }, data: { stockIssued: true } });
  await tx.inventoryMovement.create({ data: { organizationId, branchId, partId: item.partId,
    serviceOrderId: item.serviceOrderId, createdById: userId, quantity: item.quantity,
    type: InventoryMovementType.OUT, note: `SERVICE_ORDER_ITEM:${item.id}` } });
}
