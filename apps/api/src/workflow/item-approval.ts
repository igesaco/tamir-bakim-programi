import { Prisma, ServiceOrderItem } from '@prisma/client';

/** Bridge pre-link records without changing agreed prices or inventing approval. */
export async function itemApproved(tx: Prisma.TransactionClient, organizationId: string, item: ServiceOrderItem) {
  if (item.approvedQuoteId) return true;
  const candidates = await tx.quoteItem.findMany({ where: {
    quote: { organizationId, serviceOrderId: item.serviceOrderId, status: 'APPROVED' },
    OR: [{ serviceOrderItemId: item.id }, { serviceOrderItemId: null, name: item.name, type: item.type,
      quantity: item.quantity, grossTotal: item.grossTotal }],
  } });
  if (candidates.length !== 1) return false;
  const candidate = candidates[0];
  if (!candidate.serviceOrderItemId) {
    const matches = await tx.serviceOrderItem.count({ where: { serviceOrderId: item.serviceOrderId,
      name: item.name, type: item.type, quantity: item.quantity, grossTotal: item.grossTotal } });
    if (matches !== 1) return false;
    await tx.quoteItem.update({ where: { id: candidate.id }, data: { serviceOrderItemId: item.id } });
  }
  await tx.serviceOrderItem.update({ where: { id: item.id }, data: { approvedQuoteId: candidate.quoteId } });
  return true;
}
