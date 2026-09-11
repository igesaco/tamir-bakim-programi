import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationChannel, NotificationStatus, Prisma, QuoteStatus, ServiceOrderStatus, UserRole } from '@prisma/client';
import { syncPending } from './finance';
import { notifyOffice } from './notifications';

export async function applyQuoteStatus(tx: Prisma.TransactionClient, organizationId: string, id: string,
  status: QuoteStatus, access: { role?: UserRole; branchId?: string | null; customerId?: string } = {}) {
  const quote = await tx.quote.findFirst({ where: { id, organizationId,
    ...(access.customerId ? { customerId: access.customerId } : {}),
    ...(access.role === UserRole.SERVICE_ADVISOR ? { branchId: access.branchId ?? '__none__' } : {}),
  }, include: { items: true, serviceOrder: { include: { items: true, quotes: true } } } });
  if (!quote) throw new NotFoundException('Teklif bulunamadı veya erişim yetkiniz yok.');
  if (quote.status === status) return quote;
  const allowed: Partial<Record<QuoteStatus, QuoteStatus[]>> = {
    DRAFT: [QuoteStatus.SENT, QuoteStatus.APPROVED, QuoteStatus.REJECTED],
    SENT: [QuoteStatus.APPROVED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED],
    PARTIALLY_APPROVED: [QuoteStatus.APPROVED, QuoteStatus.REJECTED],
  };
  if (!allowed[quote.status]?.includes(status)) throw new BadRequestException('Bu teklif sürümü değiştirilemez. Yeni teklif oluşturun.');
  if (access.customerId && ![QuoteStatus.SENT, QuoteStatus.PARTIALLY_APPROVED].includes(quote.status as any))
    throw new BadRequestException('Bu teklif henüz onaya gönderilmedi.');
  if (status === QuoteStatus.APPROVED && quote.expiresAt && quote.expiresAt < new Date())
    throw new BadRequestException('Teklifin süresi doldu. Yeni teklif isteyin.');
  const order = quote.serviceOrder;
  if (order && [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.CANCELLED].includes(order.status as any))
    throw new BadRequestException('Kapanmış iş emrinin teklifi değiştirilemez.');
  if (status === QuoteStatus.APPROVED && order) {
    const firstApproval = !order.quotes.some(q => q.status === QuoteStatus.APPROVED);
    const linked = new Set<string>();
    for (const line of quote.items) {
      let source = line.serviceOrderItemId ? order.items.find(i => i.id === line.serviceOrderItemId) : undefined;
      if (line.serviceOrderItemId && !source) throw new BadRequestException('Teklif kalemi iş emriyle eşleşmiyor.');
      if (!source && firstApproval) {
        const candidates = order.items.filter(i => !linked.has(i.id) && i.name === line.name && i.type === line.type);
        if (candidates.length === 1) source = candidates[0];
        else if (candidates.length > 1) throw new BadRequestException('Aynı adlı işlemler için iş emri kalemini seçin.');
      }
      if (source?.approvedQuoteId || (source && linked.has(source.id)))
        throw new BadRequestException('Onaylı işlem yeniden fiyatlandırılamaz. Ek iş için yeni kalem kullanın.');
      if (source?.stockIssued && (Number(source.quantity) !== Number(line.quantity) || source.partId !== (line.partId || source.partId)))
        throw new BadRequestException('Çıkışı yapılmış parça değiştirilemez. Önce stok iadesi yapılmalı.');
      const data = { partId: line.partId || source?.partId, type: line.type, name: line.name, description: line.description,
        quantity: line.quantity, unitPrice: line.unitPrice, discountAmount: line.discountAmount,
        totalPrice: line.totalPrice, vatRate: line.vatRate, vatAmount: line.vatAmount,
        grossTotal: line.grossTotal, approvedQuoteId: quote.id };
      const item = source ? await tx.serviceOrderItem.update({ where: { id: source.id }, data })
        : await tx.serviceOrderItem.create({ data: { ...data, serviceOrderId: order.id } });
      linked.add(item.id);
      await tx.quoteItem.update({ where: { id: line.id }, data: { serviceOrderItemId: item.id, approved: true } });
    }
    if (firstApproval) {
      const removed = order.items.filter(i => !linked.has(i.id));
      if (removed.some(i => i.completed || i.stockIssued)) throw new BadRequestException('Yapılan veya stok çıkışı olan işlem tekliften çıkarılamaz.');
      await tx.serviceOrderItem.deleteMany({ where: { id: { in: removed.map(i => i.id) } } });
      await tx.quote.updateMany({ where: { serviceOrderId: order.id, id: { not: quote.id },
        status: { in: [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.PARTIALLY_APPROVED] } }, data: { status: QuoteStatus.EXPIRED } });
    }
    const beforeWork = ['ACCEPTED', 'ARRIVED', 'INSPECTION', 'QUOTE_WAITING'];
    const reopenControl = ['QUALITY_CONTROL', 'READY', 'PAYMENT_WAITING'];
    await tx.serviceOrder.update({ where: { id: order.id }, data: {
      status: beforeWork.includes(order.status) ? ServiceOrderStatus.APPROVED
        : reopenControl.includes(order.status) ? ServiceOrderStatus.IN_PROGRESS : order.status,
    } });
  }
  const updated = await tx.quote.update({ where: { id }, data: { status,
    sentAt: status === QuoteStatus.SENT ? new Date() : undefined,
    approvedAt: status === QuoteStatus.APPROVED ? new Date() : undefined,
  }, include: { items: true } });
  if (status === QuoteStatus.SENT && order && ['ACCEPTED', 'INSPECTION'].includes(order.status)) {
    await tx.serviceOrder.update({
      where: { id: order.id },
      data: { status: ServiceOrderStatus.QUOTE_WAITING },
    });
  }
  if (status === QuoteStatus.APPROVED) {
    await syncPending(tx, organizationId, id);
    if (order?.assignedTechnicianId) await tx.notification.create({ data: { organizationId, branchId: order.branchId,
      serviceOrderId: order.id, userId: order.assignedTechnicianId,
      channel: NotificationChannel.IN_APP, status: NotificationStatus.PENDING,
      title: 'Onaylı iş listesi güncellendi', message: `${order.orderNumber} iş emrinin onaylı işlemlerini kontrol edin.` } });
  }
  if (order && new Set<QuoteStatus>([QuoteStatus.SENT, QuoteStatus.APPROVED, QuoteStatus.REJECTED]).has(status)) {
    const customer = await tx.customer.findUnique({
      where: { id: quote.customerId },
      select: { portalEnabled: true },
    });
    if (customer?.portalEnabled) {
      await tx.notification.create({ data: {
        organizationId,
        branchId: order.branchId,
        customerId: quote.customerId,
        serviceOrderId: order.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.PENDING,
        title: status === QuoteStatus.SENT
          ? 'Teklifiniz hazır'
          : status === QuoteStatus.APPROVED
            ? 'Teklif onaylandı'
            : 'Teklif sonucu güncellendi',
        message: `${quote.quoteNumber} numaralı teklifin durumunu uygulamadan kontrol edebilirsiniz.`,
      } });
    }
  }
  if (order) await notifyOffice(tx, organizationId, order.branchId, order.id,
    status === QuoteStatus.APPROVED ? 'Teklif onaylandı' : status === QuoteStatus.SENT ? 'Müşteri onayı bekleniyor' : 'Teklif sonucu güncellendi',
    `${quote.quoteNumber}: ${status}`);
  return updated;
}
