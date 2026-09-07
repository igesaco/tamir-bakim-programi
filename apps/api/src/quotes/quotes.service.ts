import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  QuoteStatus,
  ServiceItemType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    branchId: string | null,
    dto: CreateQuoteDto,
  ) {
    if (!branchId) {
      throw new BadRequestException('Þube seçimi gerekli.');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: dto.vehicleId,
        customerId: dto.customerId,
        organizationId,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Müþteri veya araç bilgisi geçersiz.');
    }

    const quoteNumber =
      'QT-' +
      new Date().toISOString().replace(/\D/g, '').slice(0, 14) +
      '-' +
      Math.floor(1000 + Math.random() * 9000);

    const items = dto.items.map((item) => {
      const discount = item.discountAmount ?? 0;
      const total = item.quantity * item.unitPrice - discount;

      return {
        partId: item.partId,
        type: item.type as ServiceItemType,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: discount,
        totalPrice: total,
      };
    });

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const discountTotal = dto.items.reduce(
      (sum, item) => sum + (item.discountAmount ?? 0),
      0,
    );

    const total = subtotal - discountTotal;

    return this.prisma.quote.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        serviceOrderId: dto.serviceOrderId,
        quoteNumber,
        subtotal,
        discountTotal,
        total,
        notes: dto.notes,
        items: {
          create: items,
        },
      },
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.quote.findMany({
      where: { organizationId },
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: QuoteStatus,
  ) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, organizationId },
    });

    if (!quote) {
      throw new NotFoundException('Teklif bulunamadý.');
    }

    return this.prisma.quote.update({
      where: { id },
      data: {
        status,
        sentAt:
          status === QuoteStatus.SENT
            ? new Date()
            : undefined,
        approvedAt:
          status === QuoteStatus.APPROVED
            ? new Date()
            : undefined,
      },
      include: {
        items: true,
      },
    });
  }
}
