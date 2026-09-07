import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  QuoteStatus,
  ServiceItemType,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    organizationId: string,
    branchId: string | null,
    actorRole: UserRole,
    dto: CreateQuoteDto,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Şube seçimi gerekli.',
      );
    }

    let effectiveBranchId =
      branchId;

    if (!dto.items?.length) {
      throw new BadRequestException(
        'Teklifte en az bir kalem bulunmalıdır.',
      );
    }

    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id: dto.vehicleId,
          customerId: dto.customerId,
          organizationId,
        },
      });

    if (!vehicle) {
      throw new BadRequestException(
        'Müşteri veya araç bilgisi geçersiz.',
      );
    }

    if (dto.serviceOrderId) {
      const serviceOrder =
        await this.prisma.serviceOrder.findFirst({
          where: {
            id: dto.serviceOrderId,
            organizationId,
            customerId: dto.customerId,
            vehicleId: dto.vehicleId,
            ...(actorRole ===
            UserRole.SERVICE_ADVISOR
              ? { branchId }
              : {}),
          },
        });

      if (!serviceOrder) {
        throw new BadRequestException(
          'İş emri teklif bilgileriyle eşleşmiyor veya bu iş emrine erişim yetkiniz yok.',
        );
      }

      effectiveBranchId =
        serviceOrder.branchId;
    }

    const quoteNumber =
      'PRF-' +
      new Date()
        .toISOString()
        .replace(/\D/g, '')
        .slice(0, 14) +
      '-' +
      Math.floor(
        1000 + Math.random() * 9000,
      );

    const items = dto.items.map(
      (item) => {
        const discount =
          item.discountAmount ?? 0;
        const vatRate =
          item.vatRate ?? 20;

        const base =
          item.quantity *
          item.unitPrice;

        if (discount > base) {
          throw new BadRequestException(
            `${item.name} kalemindeki indirim tutarı satır toplamından büyük olamaz.`,
          );
        }

        const netTotal =
          base - discount;

        const vatAmount =
          netTotal *
          (vatRate / 100);

        const grossTotal =
          netTotal + vatAmount;

        return {
          partId: item.partId,
          type:
            item.type as ServiceItemType,
          name: item.name,
          description:
            item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: discount,
          totalPrice: netTotal,
          vatRate,
          vatAmount,
          grossTotal,
        };
      },
    );

    const subtotal = dto.items.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          item.unitPrice,
      0,
    );

    const discountTotal =
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.discountAmount,
          ),
        0,
      );

    const taxTotal = items.reduce(
      (sum, item) =>
        sum +
        Number(item.vatAmount),
      0,
    );

    const total = items.reduce(
      (sum, item) =>
        sum +
        Number(item.grossTotal),
      0,
    );

    return this.prisma.quote.create({
      data: {
        organizationId,
        branchId: effectiveBranchId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        serviceOrderId:
          dto.serviceOrderId,
        quoteNumber,
        subtotal,
        discountTotal,
        taxTotal,
        total,
        notes: dto.notes,
        items: {
          create: items,
        },
      },
      include: {
        organization: true,
        branch: true,
        customer: true,
        vehicle: true,
        items: true,
      },
    });
  }

  findAll(
    organizationId: string,
    actorRole: UserRole,
    branchId: string | null,
  ) {
    return this.prisma.quote.findMany({
      where: {
        organizationId,
        ...(actorRole ===
        UserRole.SERVICE_ADVISOR
          ? {
              branchId:
                branchId ??
                '__branch_not_assigned__',
            }
          : {}),
      },
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

  async findOne(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    branchId: string | null,
  ) {
    const quote =
      await this.prisma.quote.findFirst({
        where: {
          id,
          organizationId,
          ...(actorRole ===
          UserRole.SERVICE_ADVISOR
            ? {
                branchId:
                  branchId ??
                  '__branch_not_assigned__',
              }
            : {}),
        },
        include: {
          organization: true,
          branch: true,
          customer: true,
          vehicle: true,
          serviceOrder: true,
          items: true,
        },
      });

    if (!quote) {
      throw new NotFoundException(
        'Teklif bulunamadı.',
      );
    }

    return quote;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: QuoteStatus,
    actorRole: UserRole,
    branchId: string | null,
  ) {
    const quote =
      await this.prisma.quote.findFirst({
        where: {
          id,
          organizationId,
          ...(actorRole ===
          UserRole.SERVICE_ADVISOR
            ? {
                branchId:
                  branchId ??
                  '__branch_not_assigned__',
              }
            : {}),
        },
      });

    if (!quote) {
      throw new NotFoundException(
        'Teklif bulunamadı.',
      );
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
          status ===
          QuoteStatus.APPROVED
            ? new Date()
            : undefined,
      },
      include: {
        items: true,
      },
    });
  }
}
