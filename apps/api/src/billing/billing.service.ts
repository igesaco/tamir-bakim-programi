import {
  BadRequestException,
  Injectable,
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
    const customer =
      await this.prisma.customer.findFirst({
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
        await this.prisma.serviceOrder.findFirst({
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

      branchId = order.branchId;
    }

    if (dto.quoteId) {
      const quote =
        await this.prisma.quote.findFirst({
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
        quote.serviceOrderId &&
        quote.serviceOrderId !==
          dto.serviceOrderId
      ) {
        throw new BadRequestException(
          'Teklif ve iş emri birbiriyle eşleşmiyor.',
        );
      }

      branchId = quote.branchId;
    }

    if (!branchId) {
      throw new BadRequestException(
        'Tahsilat için şube seçimi gerekli.',
      );
    }

    const branch =
      await this.prisma.branch.findFirst({
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
      actorRole !== UserRole.MANAGER
    ) {
      throw new BadRequestException(
        'Tahsilat oluşturma yetkiniz yok.',
      );
    }

    const status =
      dto.status ??
      PaymentStatus.PAID;

    return this.prisma.payment.create({
      data: {
        organizationId,
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
