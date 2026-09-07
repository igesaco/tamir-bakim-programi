import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';

@Injectable()
export class ServiceOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    branchId: string | null,
    dto: CreateServiceOrderDto,
  ) {
    if (!branchId) {
      throw new BadRequestException('Þube seçimi gerekli.');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: dto.vehicleId,
        organizationId,
        customerId: dto.customerId,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Müþteri veya araç bilgisi geçersiz.');
    }

    const orderNumber =
      'SO-' +
      new Date().toISOString().replace(/\D/g, '').slice(0, 14) +
      '-' +
      Math.floor(1000 + Math.random() * 9000);

    return this.prisma.serviceOrder.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        assignedTechnicianId: dto.assignedTechnicianId,
        orderNumber,
        mileage: dto.mileage,
        complaint: dto.complaint,
        internalNote: dto.internalNote,
        status: ServiceOrderStatus.ACCEPTED,
      },
      include: {
        customer: true,
        vehicle: true,
        assignedTechnician: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.serviceOrder.findMany({
      where: { organizationId },
      include: {
        customer: true,
        vehicle: true,
        assignedTechnician: true,
        inspections: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        customer: true,
        vehicle: true,
        assignedTechnician: true,
        inspections: {
          include: {
            items: true,
            media: true,
          },
        },
        items: true,
        quotes: {
          include: {
            items: true,
          },
        },
        media: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Ýþ emri bulunamadý.');
    }

    return order;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: ServiceOrderStatus,
  ) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!order) {
      throw new NotFoundException('Ýþ emri bulunamadý.');
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status,
        deliveredAt:
          status === ServiceOrderStatus.DELIVERED
            ? new Date()
            : undefined,
      },
    });
  }
}
