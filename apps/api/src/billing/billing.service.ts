import { atomic } from '../workflow/transaction';
import { syncPending, money, itemTotal } from '../workflow/finance';
import { createHash } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  QuoteStatus,
  ServiceOrderStatus,
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
      actorBranchId ??
      customer.branchId;

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

      if (!['APPROVED', 'PARTIALLY_APPROVED'].includes(quote.status)) throw new BadRequestException('Tahsilat için teklif onayı gerekli.');
      dto.serviceOrderId = quote.serviceOrderId || undefined;
      branchId = quote.branchId ?? branchId;
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
            approvedTotal: true,
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
        Number(quote.approvedTotal ?? quote.total) -
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

  async getCustomerBalance(organizationId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId },
      include: {
        quotes: {
          where: {
            organizationId,
            status: { in: [QuoteStatus.APPROVED, QuoteStatus.PARTIALLY_APPROVED] },
          },
          select: {
            id: true,
            quoteNumber: true,
            total: true,
            approvedTotal: true,
            status: true,
            serviceOrderId: true,
            createdAt: true,
          },
        },
        serviceOrders: {
          where: {
            organizationId,
            status: { not: ServiceOrderStatus.CANCELLED },
          },
          include: {
            items: {
              select: {
                grossTotal: true,
                totalPrice: true,
                vatAmount: true,
              },
            },
            quotes: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        payments: {
          where: {
            organizationId,
            status: PaymentStatus.PAID,
          },
          select: {
            id: true,
            amount: true,
            method: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı.');
    }

    const approvedQuotesTotal = customer.quotes.reduce(
      (sum, q) => sum + Number(q.approvedTotal ?? q.total ?? 0),
      0,
    );

    const unquotedOrdersTotal = customer.serviceOrders
      .filter(
        (order) =>
          !order.quotes.some(
            (q) =>
              q.status === QuoteStatus.APPROVED ||
              q.status === QuoteStatus.PARTIALLY_APPROVED,
          ),
      )
      .reduce((sum, order) => {
        const orderSum = order.items.reduce(
          (iSum, item) => iSum + itemTotal(item),
          0,
        );
        return sum + orderSum;
      }, 0);

    const totalBilled = money(approvedQuotesTotal + unquotedOrdersTotal);
    const totalPaid = money(
      customer.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    );
    const openBalance = money(Math.max(0, totalBilled - totalPaid));

    return {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      phone: customer.phone,
      totalBilled,
      totalPaid,
      openBalance,
      lastPaymentDate:
        customer.payments[0]?.paidAt ||
        customer.payments[0]?.createdAt ||
        null,
      pendingOrdersCount: customer.serviceOrders.filter(
        (o) =>
          o.status !== ServiceOrderStatus.DELIVERED &&
          o.status !== ServiceOrderStatus.CANCELLED,
      ).length,
      pendingQuotesCount: customer.quotes.length,
    };
  }

  async getAgingReport(organizationId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { organizationId },
      include: {
        quotes: {
          where: {
            organizationId,
            status: { in: [QuoteStatus.APPROVED, QuoteStatus.PARTIALLY_APPROVED] },
          },
          select: {
            id: true,
            total: true,
            approvedTotal: true,
            approvedAt: true,
            createdAt: true,
          },
        },
        serviceOrders: {
          where: {
            organizationId,
            status: { not: ServiceOrderStatus.CANCELLED },
          },
          include: {
            items: {
              select: {
                grossTotal: true,
                totalPrice: true,
                vatAmount: true,
              },
            },
            quotes: {
              select: { id: true, status: true },
            },
          },
        },
        payments: {
          where: {
            organizationId,
            status: PaymentStatus.PAID,
          },
          select: {
            amount: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });

    const now = new Date();
    const resultCustomers: any[] = [];
    let grandTotalOutstanding = 0;
    let grandCurrent = 0;
    let grandDays31to60 = 0;
    let grandDays61to90 = 0;
    let grandOver90 = 0;

    for (const customer of customers) {
      const approvedQuotesTotal = customer.quotes.reduce(
        (sum, q) => sum + Number(q.approvedTotal ?? q.total ?? 0),
        0,
      );

      const unquotedOrdersTotal = customer.serviceOrders
        .filter(
          (order) =>
            !order.quotes.some(
              (q) =>
                q.status === QuoteStatus.APPROVED ||
                q.status === QuoteStatus.PARTIALLY_APPROVED,
            ),
        )
        .reduce((sum, order) => {
          return (
            sum +
            order.items.reduce((iSum, item) => iSum + itemTotal(item), 0)
          );
        }, 0);

      const totalBilled = money(approvedQuotesTotal + unquotedOrdersTotal);
      const totalPaid = money(
        customer.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      );
      const openBalance = money(Math.max(0, totalBilled - totalPaid));

      if (openBalance <= 0) continue;

      const obligations: { date: Date; amount: number }[] = [];

      for (const q of customer.quotes) {
        obligations.push({
          date: q.approvedAt || q.createdAt,
          amount: Number(q.approvedTotal ?? q.total ?? 0),
        });
      }

      for (const order of customer.serviceOrders) {
        if (
          !order.quotes.some(
            (q) =>
              q.status === QuoteStatus.APPROVED ||
              q.status === QuoteStatus.PARTIALLY_APPROVED,
          )
        ) {
          const amt = order.items.reduce(
            (iSum, item) => iSum + itemTotal(item),
            0,
          );
          if (amt > 0) {
            obligations.push({
              date: order.createdAt,
              amount: amt,
            });
          }
        }
      }

      obligations.sort((a, b) => a.date.getTime() - b.date.getTime());

      let paidPool = totalPaid;
      let cCurrent = 0;
      let c31to60 = 0;
      let c61to90 = 0;
      let cOver90 = 0;
      let oldestDate: Date | null = null;

      for (const ob of obligations) {
        if (paidPool >= ob.amount) {
          paidPool -= ob.amount;
        } else {
          const unpaidPart = ob.amount - paidPool;
          paidPool = 0;

          if (!oldestDate) oldestDate = ob.date;

          const diffDays = Math.max(
            0,
            Math.floor(
              (now.getTime() - ob.date.getTime()) / (1000 * 60 * 60 * 24),
            ),
          );
          if (diffDays <= 30) {
            cCurrent += unpaidPart;
          } else if (diffDays <= 60) {
            c31to60 += unpaidPart;
          } else if (diffDays <= 90) {
            c61to90 += unpaidPart;
          } else {
            cOver90 += unpaidPart;
          }
        }
      }

      const bucketedSum = cCurrent + c31to60 + c61to90 + cOver90;
      if (bucketedSum < openBalance) {
        cCurrent += openBalance - bucketedSum;
      }

      cCurrent = money(cCurrent);
      c31to60 = money(c31to60);
      c61to90 = money(c61to90);
      cOver90 = money(cOver90);

      grandTotalOutstanding += openBalance;
      grandCurrent += cCurrent;
      grandDays31to60 += c31to60;
      grandDays61to90 += c61to90;
      grandOver90 += cOver90;

      resultCustomers.push({
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        phone: customer.phone,
        totalBalance: openBalance,
        current: cCurrent,
        days31to60: c31to60,
        days61to90: c61to90,
        over90: cOver90,
        oldestDate,
      });
    }

    resultCustomers.sort((a, b) => b.totalBalance - a.totalBalance);

    return {
      summary: {
        totalOutstanding: money(grandTotalOutstanding),
        current: money(grandCurrent),
        days31to60: money(grandDays31to60),
        days61to90: money(grandDays61to90),
        over90: money(grandOver90),
        customerCount: resultCustomers.length,
      },
      customers: resultCustomers,
    };
  }

  async getSummary(organizationId: string, from?: string, to?: string) {
    const where: Prisma.PaymentWhereInput = {
      organizationId,
      status: PaymentStatus.PAID,
    };

    if (from || to) {
      where.paidAt = {};
      if (from) where.paidAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        if (to.length === 10) toDate.setHours(23, 59, 59, 999);
        where.paidAt.lte = toDate;
      }
    }

    const payments = await this.prisma.payment.findMany({
      where,
      select: {
        amount: true,
        method: true,
      },
    });

    const summary = {
      TOTAL: 0,
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      OTHER: 0,
      count: payments.length,
    };

    for (const p of payments) {
      const amt = Number(p.amount);
      summary.TOTAL += amt;
      if (p.method in summary) {
        (summary as any)[p.method] += amt;
      } else {
        summary.OTHER += amt;
      }
    }

    summary.TOTAL = money(summary.TOTAL);
    summary.CASH = money(summary.CASH);
    summary.CARD = money(summary.CARD);
    summary.TRANSFER = money(summary.TRANSFER);
    summary.OTHER = money(summary.OTHER);

    return summary;
  }

  async findAll(
    organizationId: string,
    query?: {
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
      customerId?: string;
      method?: PaymentMethod;
      status?: PaymentStatus;
    },
  ) {
    const where: Prisma.PaymentWhereInput = {
      organizationId,
    };

    if (query?.customerId) {
      where.customerId = query.customerId;
    }
    if (query?.method) {
      where.method = query.method;
    }
    if (query?.status) {
      where.status = query.status;
    }

    if (query?.from || query?.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        if (query.to.length === 10) toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    if (query?.page || query?.limit) {
      const page = Math.max(1, Number(query.page || 1));
      const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
      const skip = (page - 1) * limit;

      const [total, items, summaryAgg] = await Promise.all([
        this.prisma.payment.count({ where }),
        this.prisma.payment.findMany({
          where,
          include: {
            branch: true,
            customer: true,
            serviceOrder: true,
            quote: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.payment.aggregate({
          where: { ...where, status: PaymentStatus.PAID },
          _sum: { amount: true },
        }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalPaid: money(Number(summaryAgg._sum.amount || 0)),
      };
    }

    return this.prisma.payment.findMany({
      where,
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
