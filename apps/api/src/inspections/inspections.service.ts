import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InspectionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    branchId: string | null,
    userId: string,
    dto: CreateInspectionDto,
  ) {
    if (!branchId) {
      throw new BadRequestException('Þube seçimi gerekli.');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: dto.vehicleId,
        organizationId,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Araç bulunamadý.');
    }

    if (dto.serviceOrderId) {
      const serviceOrder = await this.prisma.serviceOrder.findFirst({
        where: {
          id: dto.serviceOrderId,
          organizationId,
          vehicleId: dto.vehicleId,
        },
      });

      if (!serviceOrder) {
        throw new BadRequestException('Ýþ emri geçersiz.');
      }
    }

    return this.prisma.inspection.create({
      data: {
        organizationId,
        branchId,
        vehicleId: dto.vehicleId,
        serviceOrderId: dto.serviceOrderId,
        inspectorId: userId,
        mileage: dto.mileage,
        fuelLevel: dto.fuelLevel,
        customerComplaint: dto.customerComplaint,
        existingDamage: dto.existingDamage,
        valuablesNote: dto.valuablesNote,
      },
      include: {
        vehicle: true,
        items: true,
        media: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.inspection.findMany({
      where: { organizationId },
      include: {
        vehicle: true,
        items: true,
        media: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async complete(organizationId: string, id: string) {
    const inspection = await this.prisma.inspection.findFirst({
      where: { id, organizationId },
    });

    if (!inspection) {
      throw new NotFoundException('Kontrol kaydý bulunamadý.');
    }

    return this.prisma.inspection.update({
      where: { id },
      data: {
        status: InspectionStatus.COMPLETED,
      },
    });
  }
}
