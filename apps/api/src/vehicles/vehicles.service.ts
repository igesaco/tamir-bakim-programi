import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    organizationId: string,
    branchId: string | null,
    dto: CreateVehicleDto,
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
        'Araç eklenecek müşteri bulunamadı.',
      );
    }

    try {
      return await this.prisma.vehicle.create({
        data: {
          organizationId,
          branchId,
          customerId: dto.customerId,

          plate: dto.plate
            .trim()
            .toUpperCase(),

          vin: dto.vin
            ?.trim()
            .toUpperCase(),

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
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'Bu plaka veya VIN numarası başka bir araçta kayıtlı.',
        );
      }

      throw error;
    }
  }

  findAll(
    organizationId: string,
  ) {
    return this.prisma.vehicle.findMany({
      where: {
        organizationId,
      },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    organizationId: string,
    id: string,
  ) {
    const vehicle =
      await this.prisma.vehicle.findFirst({
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
      throw new NotFoundException(
        'Araç bulunamadı.',
      );
    }

    return vehicle;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateVehicleDto,
  ) {
    await this.findOne(
      organizationId,
      id,
    );

    if (dto.customerId) {
      const customer =
        await this.prisma.customer.findFirst({
          where: {
            id: dto.customerId,
            organizationId,
          },
        });

      if (!customer) {
        throw new BadRequestException(
          'Seçilen müşteri bulunamadı.',
        );
      }
    }

    try {
      return await this.prisma.vehicle.update({
        where: {
          id,
        },
        data: {
          customerId:
            dto.customerId,

          plate: dto.plate
            ? dto.plate
                .trim()
                .toUpperCase()
            : undefined,

          vin:
            dto.vin !== undefined
              ? dto.vin
                  .trim()
                  .toUpperCase()
              : undefined,

          brand: dto.brand,
          model: dto.model,
          modelYear: dto.modelYear,
          fuelType: dto.fuelType,
          transmission:
            dto.transmission,
          color: dto.color,
          mileage: dto.mileage,
          notes: dto.notes,
          qrActive: dto.qrActive,
        },
        include: {
          customer: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'Bu plaka veya VIN numarası başka bir araçta kayıtlı.',
        );
      }

      throw error;
    }
  }

  async remove(
    organizationId: string,
    id: string,
  ) {
    await this.findOne(
      organizationId,
      id,
    );

    const [
      appointmentCount,
      serviceOrderCount,
      inspectionCount,
      maintenanceRecordCount,
      maintenancePlanCount,
      mediaCount,
      quoteCount,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          vehicleId: id,
        },
      }),

      this.prisma.serviceOrder.count({
        where: {
          vehicleId: id,
        },
      }),

      this.prisma.inspection.count({
        where: {
          vehicleId: id,
        },
      }),

      this.prisma.maintenanceRecord.count({
        where: {
          vehicleId: id,
        },
      }),

      this.prisma.maintenancePlan.count({
        where: {
          vehicleId: id,
        },
      }),

      this.prisma.media.count({
        where: {
          vehicleId: id,
        },
      }),

      this.prisma.quote.count({
        where: {
          vehicleId: id,
        },
      }),
    ]);

    const dependencyCount =
      appointmentCount +
      serviceOrderCount +
      inspectionCount +
      maintenanceRecordCount +
      maintenancePlanCount +
      mediaCount +
      quoteCount;

    if (dependencyCount > 0) {
      throw new BadRequestException(
        'Bu araca bağlı servis, bakım veya diğer kayıtlar bulunduğu için araç silinemez.',
      );
    }

    await this.prisma.vehicle.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Araç silindi.',
    };
  }

  async findPublicByQr(
    qrToken: string,
  ) {
    const vehicle =
      await this.prisma.vehicle.findFirst({
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
          fuelType: true,
          transmission: true,
          mileage: true,
          qrToken: true,

          maintenanceRecords: {
            select: {
              performedAt: true,
              mileage: true,
              totalAmount: true,
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
              id: true,
              title: true,
              nextDueKm: true,
              nextDueDate: true,
              estimatedPriceMin: true,
              estimatedPriceMax: true,
            },
          },
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'QR kod geçersiz veya pasif.',
      );
    }

    return vehicle;
  }
}
