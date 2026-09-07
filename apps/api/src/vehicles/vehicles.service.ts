import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private accessWhere(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
  ) {
    return {
      organizationId,
      ...(role ===
      UserRole.SERVICE_ADVISOR
        ? {
            branchId:
              branchId ??
              '__branch_not_assigned__',
          }
        : {}),
    };
  }

  async create(
    organizationId: string,
    actorBranchId: string | null,
    role: UserRole,
    dto: CreateVehicleDto,
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id: dto.customerId,
          organizationId,
          ...(role ===
          UserRole.SERVICE_ADVISOR
            ? {
                branchId:
                  actorBranchId ??
                  '__branch_not_assigned__',
              }
            : {}),
        },
      });

    if (!customer) {
      throw new BadRequestException(
        'Araç eklenecek müşteri bulunamadı veya erişim yetkiniz yok.',
      );
    }

    const branchId =
      customer.branchId ??
      actorBranchId;

    if (
      role ===
        UserRole.SERVICE_ADVISOR &&
      !branchId
    ) {
      throw new BadRequestException(
        'Servis danışmanı için şube ataması gerekli.',
      );
    }

    const normalizedVin =
      dto.vin?.trim()
        ? dto.vin
            .trim()
            .toUpperCase()
        : null;

    try {
      return await this.prisma.vehicle.create({
        data: {
          organizationId,
          branchId,
          customerId: dto.customerId,
          plate: dto.plate
            .trim()
            .toUpperCase(),
          vin: normalizedVin,
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
    role: UserRole,
    branchId: string | null,
  ) {
    return this.prisma.vehicle.findMany({
      where: this.accessWhere(
        organizationId,
        role,
        branchId,
      ),
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
    role: UserRole,
    branchId: string | null,
  ) {
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id,
          ...this.accessWhere(
            organizationId,
            role,
            branchId,
          ),
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
          serviceOrders: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              mileage: true,
              createdAt: true,
              deliveredAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'Araç bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return vehicle;
  }

  async update(
    organizationId: string,
    id: string,
    role: UserRole,
    actorBranchId: string | null,
    dto: UpdateVehicleDto,
  ) {
    const current =
      await this.findOne(
        organizationId,
        id,
        role,
        actorBranchId,
      );

    let branchId:
      | string
      | null
      | undefined = undefined;

    if (dto.customerId) {
      const customer =
        await this.prisma.customer.findFirst({
          where: {
            id: dto.customerId,
            organizationId,
            ...(role ===
            UserRole.SERVICE_ADVISOR
              ? {
                  branchId:
                    actorBranchId ??
                    '__branch_not_assigned__',
                }
              : {}),
          },
        });

      if (!customer) {
        throw new BadRequestException(
          'Seçilen müşteri bulunamadı veya erişim yetkiniz yok.',
        );
      }

      branchId =
        customer.branchId ??
        current.branchId;
    }

    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data: {
          customerId:
            dto.customerId,
          branchId,
          plate: dto.plate
            ? dto.plate
                .trim()
                .toUpperCase()
            : undefined,
          vin:
            dto.vin !== undefined
              ? dto.vin.trim()
                ? dto.vin
                    .trim()
                    .toUpperCase()
                : null
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
    role: UserRole,
    branchId: string | null,
  ) {
    await this.findOne(
      organizationId,
      id,
      role,
      branchId,
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
        where: { vehicleId: id },
      }),
      this.prisma.serviceOrder.count({
        where: { vehicleId: id },
      }),
      this.prisma.inspection.count({
        where: { vehicleId: id },
      }),
      this.prisma.maintenanceRecord.count({
        where: { vehicleId: id },
      }),
      this.prisma.maintenancePlan.count({
        where: { vehicleId: id },
      }),
      this.prisma.media.count({
        where: { vehicleId: id },
      }),
      this.prisma.quote.count({
        where: { vehicleId: id },
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
      where: { id },
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
              id: true,
              performedAt: true,
              mileage: true,
              items: {
                select: {
                  name: true,
                  description: true,
                },
              },
            },
            orderBy: {
              performedAt: 'desc',
            },
            take: 5,
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
            },
            orderBy: [
              {
                nextDueDate: 'asc',
              },
              {
                nextDueKm: 'asc',
              },
            ],
          },
        },
      });

    if (!vehicle) {
      throw new NotFoundException(
        'QR kod geçersiz veya pasif.',
      );
    }

    const {
      maintenanceRecords,
      maintenancePlans,
      ...publicVehicle
    } = vehicle;

    return {
      vehicle: publicVehicle,
      lastMaintenanceRecord:
        maintenanceRecords[0] ??
        null,
      maintenanceHistory:
        maintenanceRecords,
      maintenancePlans,
    };
  }
}
