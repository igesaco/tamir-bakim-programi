import { atomic } from '../workflow/transaction';
import { syncPending } from '../workflow/finance';
import { createHash } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    organizationId: string,
    actorBranchId: string | null,
    actorRole: UserRole,
    dto: CreatePaymentDto,
  ) {
    if (dto.status && dto.status !== PaymentStatus.PAID) throw new BadRequestException('Tahsilat ödenmiş olarak kaydedilmelidir.');
    const requestHash = createHash('sha256').update(JSON.stringify(dto)).digest('hex');
    dto = { ...dto };
    return atomic(this.prisma, organizationId, async tx => {
      if (dto.requestKey) {
        const previous = await tx.payment.findUnique({ where: { organizationId_requestKey: { organizationId, requestKey: dto.requestKey } } });
        if (previous) {
          if (previous.requestHash !== requestHash) throw new BadRequestException('Tekrar isteğinin içeriği değişti. Yeni işlem başlatın.');
          return previous;
        }
      }
    const customer =
      await tx.customer.findFirst({
        where: {
          id: dto.customerId,
          organizationId,
        },
      });

    if (!customer) {
      throw new BadRequestException(
        'Müşteri bulunamadı.',
      );
    }

    let branchId =
      dto.branchId ??
      actorBranchId;

    if (dto.serviceOrderId) {
      const order =
        await tx.serviceOrder.findFirst({
          where: {
            id: dto.serviceOrderId,
            organizationId,
            customerId: dto.customerId,
          },
        });

      if (!order) {
        throw new BadRequestException(
          'İş emri bulunamadı.',
        );
      }

      if (order.status === 'CANCELLED') throw new BadRequestException('İptal edilen iş emrine tahsilat girilemez.');
      if (!dto.quoteId) {
        const quotes = await tx.quote.findMany({ where: { organizationId, serviceOrderId: order.id } });
        const approved = quotes.filter(q => q.status === 'APPROVED');
        if (approved.length > 1) throw new BadRequestException('Tahsilat yapılacak teklifi seçin.');
        if (quotes.length && !approved.length) throw new BadRequestException('Teklif onayı gerekli.');
        dto.quoteId = approved[0]?.id;
      }
      branchId = order.branchId;
    }

    if (dto.quoteId) {
      const quote =
        await tx.quote.findFirst({
          where: {
            id: dto.quoteId,
            organizationId,
            customerId: dto.customerId,
          },
        });

      if (!quote) {
        throw new BadRequestException(
          'Teklif bulunamadı.',
        );
      }

      if (
        dto.serviceOrderId &&
        quote.serviceOrderId !==
          dto.serviceOrderId
      ) {
        throw new BadRequestException(
          'Teklif ve iş emri birbiriyle eşleşmiyor.',
        );
      }

      if (quote.status !== 'APPROVED') throw new BadRequestException('Tahsilat için teklif onayı gerekli.');
      dto.serviceOrderId = quote.serviceOrderId || undefined;
      branchId = quote.branchId;
    }

    if (!branchId) {
      throw new BadRequestException(
        'Tahsilat için şube seçimi gerekli.',
      );
    }

    const branch =
      await tx.branch.findFirst({
        where: {
          id: branchId,
          organizationId,
          active: true,
        },
      });

    if (!branch) {
      throw new BadRequestException(
        'Geçerli ve aktif bir şube seçiniz.',
      );
    }

    if (
      actorRole !== UserRole.OWNER &&
      actorRole !== UserRole.MANAGER &&
      actorRole !== UserRole.ACCOUNTING
    ) {
      throw new BadRequestException(
        'Tahsilat oluşturma yetkiniz yok.',
      );
    }

    if (dto.quoteId) {
      const quote =
        await tx.quote.findFirst({
          where: {
            id: dto.quoteId,
            organizationId,
          },
          select: {
            total: true,
          },
        });

      if (!quote) {
        throw new BadRequestException(
          'Teklif bulunamadı.',
        );
      }

      const paid =
        await tx.payment.aggregate({
          where: {
            organizationId,
            quoteId: dto.quoteId,
            status:
              PaymentStatus.PAID,
          },
          _sum: {
            amount: true,
          },
        });

      const remaining =
        Number(quote.total) -
        Number(
          paid._sum.amount ?? 0,
        );

      if (
        Number(dto.amount) >
        remaining + 0.01
      ) {
        throw new BadRequestException(
          `Tahsilat teklif kalan bakiyesini aşıyor. Kalan: ${Math.max(
            0,
            remaining,
          ).toFixed(2)} TL`,
        );
      }
    } else if (dto.serviceOrderId) {
      const items =
        await tx.serviceOrderItem.findMany({
          where: {
            serviceOrderId:
              dto.serviceOrderId,
          },
          select: {
            totalPrice: true,
            vatAmount: true,
            grossTotal: true,
          },
        });

      const orderTotal =
        items.reduce(
          (sum, item) => {
            const gross =
              Number(
                item.grossTotal ??
                  0,
              );

            return (
              sum +
              (gross > 0
                ? gross
                : Number(
                    item.totalPrice,
                  ) +
                  Number(
                    item.vatAmount ??
                      0,
                  ))
            );
          },
          0,
        );

      if (orderTotal >= 0) {
        const paid =
          await tx.payment.aggregate({
            where: {
              organizationId,
              serviceOrderId:
                dto.serviceOrderId,
              status:
                PaymentStatus.PAID,
            },
            _sum: {
              amount: true,
            },
          });

        const remaining =
          orderTotal -
          Number(
            paid._sum.amount ??
              0,
          );

        if (
          Number(dto.amount) >
          remaining + 0.01
        ) {
          throw new BadRequestException(
            `Tahsilat iş emri kalan bakiyesini aşıyor. Kalan: ${Math.max(
              0,
              remaining,
            ).toFixed(2)} TL`,
          );
        }
      }
    }

    const status =
      dto.status ??
      PaymentStatus.PAID;

    const result = await tx.payment.create({
      data: {
        organizationId,
        requestKey: dto.requestKey,
        requestHash,
        branchId,
        customerId:
          dto.customerId,
        serviceOrderId:
          dto.serviceOrderId,
        quoteId:
          dto.quoteId,
        amount:
          dto.amount,
        method:
          dto.method,
        status,
        reference:
          dto.reference,
        paidAt:
          status ===
          PaymentStatus.PAID
            ? new Date()
            : null,
      },
      include: {
        branch: true,
        customer: true,
        serviceOrder: true,
        quote: true,
      },
    });
    if (dto.quoteId) await syncPending(tx, organizationId, dto.quoteId);
    return result;
    });
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: PaymentStatus,
  ) {
    return atomic(this.prisma, organizationId, async tx => {
    const payment =
      await tx.payment.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Tahsilat kaydı bulunamadı.',
      );
    }

    if (payment.status === status) return payment;
    if (payment.status !== PaymentStatus.PAID) throw new BadRequestException('Yalnızca ödenmiş tahsilat iptal/iade edilebilir.');
    if (
      status !== PaymentStatus.CANCELLED &&
      status !== PaymentStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Tahsilat durumu yalnızca iptal veya iade olarak değiştirilebilir.',
      );
    }

    const result = await tx.payment.update({
      where: { id },
      data: {
        status,
        paidAt:
          payment.paidAt,
      },
      include: {
        branch: true,
        customer: true,
        serviceOrder: true,
        quote: true,
      },
    });
    if (payment.quoteId) await syncPending(tx, organizationId, payment.quoteId);
    return result;
    });
  }

  findAll(
    organizationId: string,
  ) {
    return this.prisma.payment.findMany({
      where: {
        organizationId,
      },
      include: {
        branch: true,
        customer: true,
        serviceOrder: true,
        quote: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
