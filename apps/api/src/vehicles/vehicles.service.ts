import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    branchId: string | null,
    dto: CreateVehicleDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        organizationId,
      },
    });

    if (!customer) {
      throw new BadRequestException(
        'Araç eklenecek müşteri bulunamadı.',
      );
    }

    return this.prisma.vehicle.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,

        plate: dto.plate.trim().toUpperCase(),
        vin: dto.vin?.trim().toUpperCase(),

        brand: dto.brand,
        model: dto.model,
        modelYear: dto.modelYear,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        color: dto.color,
        mileage: dto.mileage ?? 0,
        notes: dto.notes,
      },
      include: {
        customer: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.vehicle.findMany({
      where: { organizationId },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        customer: true,
        maintenanceRecords: {
          include: {
            items: true,
          },
          orderBy: {
            performedAt: 'desc',
          },
        },
        maintenancePlans: true,
        media: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Araç bulunamadı.');
    }

    return vehicle;
  }

  async findPublicByQr(qrToken: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        qrToken,
        qrActive: true,
      },
      select: {
        id: true,
        plate: true,
        brand: true,
        model: true,
        modelYear: true,
        mileage: true,
        qrToken: true,
        maintenanceRecords: {
          select: {
            performedAt: true,
            mileage: true,
          },
          orderBy: {
            performedAt: 'desc',
          },
          take: 1,
        },
        maintenancePlans: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            title: true,
            nextDueKm: true,
            nextDueDate: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('QR kod geçersiz veya pasif.');
    }

    return vehicle;
  }
}