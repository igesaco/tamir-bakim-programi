import {
  InventoryReservationStatus,
  Prisma,
  ProcurementRequestStatus,
  ServiceItemType,
} from '@prisma/client';

export async function reserveOrderParts(
  tx: Prisma.TransactionClient,
  organizationId: string,
  serviceOrderId: string,
) {
  const order = await tx.serviceOrder.findFirstOrThrow({
    where: { id: serviceOrderId, organizationId },
    include: { items: true },
  });
  let shortage = false;

  for (const item of order.items.filter(value =>
    value.type === ServiceItemType.PART && Boolean(value.approvedQuoteId) && !value.stockIssued)) {
    const requested = Number(item.quantity);
    const inventory = item.partId ? await tx.inventory.findUnique({
      where: { branchId_partId: { branchId: order.branchId, partId: item.partId } },
    }) : null;
    if (inventory) {
      // Aynı parçayı iki onay aynı anda tüketemesin; rezervasyon hesabı boyunca
      // fiziksel stok satırını kilitli tutarız.
      await tx.$queryRaw`SELECT "id" FROM "Inventory" WHERE "id" = ${inventory.id} FOR UPDATE`;
    }
    const existing = await tx.inventoryReservation.findUnique({
      where: { serviceOrderItemId: item.id },
    });
    const reserved = inventory ? await tx.inventoryReservation.aggregate({
      where: {
        inventoryId: inventory.id,
        status: InventoryReservationStatus.ACTIVE,
        serviceOrderItemId: { not: item.id },
      },
      _sum: { quantity: true },
    }) : null;
    const available = Number(inventory?.quantity || 0) - Number(reserved?._sum.quantity || 0);

    if (inventory && available >= requested) {
      await tx.inventoryReservation.upsert({
        where: { serviceOrderItemId: item.id },
        create: {
          organizationId, branchId: order.branchId, inventoryId: inventory.id,
          serviceOrderId: order.id, serviceOrderItemId: item.id, quantity: item.quantity,
        },
        update: { inventoryId: inventory.id, quantity: item.quantity, status: InventoryReservationStatus.ACTIVE },
      });
      await tx.procurementRequest.updateMany({
        where: { serviceOrderItemId: item.id, status: ProcurementRequestStatus.OPEN },
        data: { status: ProcurementRequestStatus.CANCELLED, note: 'Stok rezervasyonu oluştu.' },
      });
      continue;
    }

    shortage = true;
    if (existing?.status === InventoryReservationStatus.ACTIVE) {
      await tx.inventoryReservation.update({
        where: { id: existing.id }, data: { status: InventoryReservationStatus.RELEASED },
      });
    }
    const openRequest = await tx.procurementRequest.findFirst({
      where: { serviceOrderItemId: item.id, status: ProcurementRequestStatus.OPEN },
    });
    const missing = Math.max(requested - Math.max(0, available), 0.01);
    const data = {
      organizationId, branchId: order.branchId, serviceOrderId: order.id,
      serviceOrderItemId: item.id, partId: item.partId, partName: item.name,
      quantity: new Prisma.Decimal(missing),
      note: `Kullanılabilir stok: ${Math.max(0, available)}`,
    };
    if (openRequest) await tx.procurementRequest.update({ where: { id: openRequest.id }, data });
    else await tx.procurementRequest.create({ data });
  }

  return { shortage };
}
