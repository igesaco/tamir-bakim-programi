import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    branchId: string | null,
    dto: CreatePaymentDto,
  ) {
    if (!branchId) {
      throw new BadRequestException('Þube seçimi gerekli.');
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        organizationId,
      },
    });

    if (!customer) {
      throw new BadRequestException('Müþteri bulunamadý.');
    }

    if (dto.serviceOrderId) {
      const order = await this.prisma.serviceOrder.findFirst({
        where: {
          id: dto.serviceOrderId,
          organizationId,
          customerId: dto.customerId,
        },
      });

      if (!order) {
        throw new BadRequestException('Ýþ emri bulunamadý.');
      }
    }

    if (dto.quoteId) {
      const quote = await this.prisma.quote.findFirst({
        where: {
          id: dto.quoteId,
          organizationId,
          customerId: dto.customerId,
        },
      });

      if (!quote) {
        throw new BadRequestException('Teklif bulunamadý.');
      }
    }

    const status = dto.status ?? PaymentStatus.PAID;

    return this.prisma.payment.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,
        serviceOrderId: dto.serviceOrderId,
        quoteId: dto.quoteId,
        amount: dto.amount,
        method: dto.method,
        status,
        reference: dto.reference,
        paidAt:
          status === PaymentStatus.PAID
            ? new Date()
            : null,
      },
      include: {
        customer: true,
        serviceOrder: true,
        quote: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.payment.findMany({
      where: {
        organizationId,
      },
      include: {
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
