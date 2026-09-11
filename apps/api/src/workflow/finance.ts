import { PaymentMethod, PaymentStatus, Prisma, QuoteStatus } from '@prisma/client';

export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const itemTotal = (item: { grossTotal?: unknown; totalPrice?: unknown; vatAmount?: unknown }) =>
  money(Number(item.grossTotal) || Number(item.totalPrice || 0) + Number(item.vatAmount || 0));

export async function quoteBalance(tx: Prisma.TransactionClient, organizationId: string, quoteId: string) {
  const quote = await tx.quote.findFirstOrThrow({ where: { id: quoteId, organizationId } });
  const paid = await tx.payment.aggregate({ where: { organizationId, quoteId, status: PaymentStatus.PAID }, _sum: { amount: true } });
  return { quote, remaining: money(Math.max(0, Number(quote.total) - Number(paid._sum.amount || 0))) };
}

// PENDING is a compatibility projection of the remaining debt, never a receipt.
// An already-paid quote must never retain a second full pending balance.
export async function syncPending(tx: Prisma.TransactionClient, organizationId: string, quoteId: string) {
  const { quote, remaining } = await quoteBalance(tx, organizationId, quoteId);
  const pending = await tx.payment.findMany({ where: { organizationId, quoteId, status: PaymentStatus.PENDING }, orderBy: { createdAt: 'asc' } });
  const amount = quote.status === QuoteStatus.APPROVED ? remaining : 0;
  if (pending.length) {
    await tx.payment.updateMany({ where: { id: { in: pending.map(p => p.id) } }, data: { status: PaymentStatus.SETTLED } });
    if (amount > 0) await tx.payment.update({ where: { id: pending[0].id }, data: { amount, status: PaymentStatus.PENDING } });
  } else if (amount > 0) {
    await tx.payment.create({ data: { organizationId, branchId: quote.branchId, customerId: quote.customerId,
      serviceOrderId: quote.serviceOrderId, quoteId, amount, status: PaymentStatus.PENDING,
      method: PaymentMethod.OTHER, reference: `QUOTE_BALANCE:${quoteId}` } });
  }
  return remaining;
}

export async function orderBalance(tx: Prisma.TransactionClient, organizationId: string, serviceOrderId: string) {
  const order = await tx.serviceOrder.findFirstOrThrow({ where: { id: serviceOrderId, organizationId }, include: { quotes: true, items: true } });
  const billed = order.quotes.length
    ? order.quotes.filter(q => q.status === QuoteStatus.APPROVED).reduce((sum, q) => sum + Number(q.total), 0)
    : order.items.reduce((sum, i) => sum + itemTotal(i), 0);
  const paid = await tx.payment.aggregate({ where: { organizationId, serviceOrderId, status: PaymentStatus.PAID }, _sum: { amount: true } });
  return money(Math.max(0, billed - Number(paid._sum.amount || 0)));
}
