import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createRecord(
    organizationId: string,
    branchId: string | null,
    dto: CreateMaintenanceRecordDto,
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

    const items = dto.items.map((item) => ({
      partId: item.partId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

    const result = await this.prisma.maintenanceRecord.create({
      data: {
        organizationId,
        branchId,
        vehicleId: dto.vehicleId,
        serviceOrderId: dto.serviceOrderId,
        mileage: dto.mileage,
        performedAt: dto.performedAt
          ? new Date(dto.performedAt)
          : new Date(),
        notes: dto.notes,
        totalAmount,
        items: {
          create: items,
        },
      },
      include: {
        vehicle: true,
        items: true,
      },
    });

    if (dto.mileage > vehicle.mileage) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: {
          mileage: dto.mileage,
        },
      });
    }

    return result;
  }

  async createPlan(
    organizationId: string,
    branchId: string | null,
    dto: CreateMaintenancePlanDto,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: dto.vehicleId,
        organizationId,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Araç bulunamadý.');
    }

    return this.prisma.maintenancePlan.create({
      data: {
        organizationId,
        branchId,
        vehicleId: dto.vehicleId,
        title: dto.title,
        category: dto.category,
        description: dto.description,
        intervalKm: dto.intervalKm,
        intervalMonths: dto.intervalMonths,
        lastKm: vehicle.mileage,
        lastDate: new Date(),
        nextDueKm: dto.nextDueKm,
        nextDueDate: dto.nextDueDate
          ? new Date(dto.nextDueDate)
          : null,
        estimatedPriceMin: dto.estimatedPriceMin,
        estimatedPriceMax: dto.estimatedPriceMax,
      },
      include: {
        vehicle: true,
      },
    });
  }

  findRecords(organizationId: string, vehicleId?: string) {
    return this.prisma.maintenanceRecord.findMany({
      where: {
        organizationId,
        vehicleId,
      },
      include: {
        vehicle: true,
        items: true,
      },
      orderBy: {
        performedAt: 'desc',
      },
    });
  }

  findPlans(organizationId: string, vehicleId?: string) {
    return this.prisma.maintenancePlan.findMany({
      where: {
        organizationId,
        vehicleId,
      },
      include: {
        vehicle: true,
      },
      orderBy: [
        {
          nextDueDate: 'asc',
        },
        {
          nextDueKm: 'asc',
        },
      ],
    });
  }

  async completePlan(organizationId: string, id: string) {
    const plan = await this.prisma.maintenancePlan.findFirst({
      where: { id, organizationId },
    });

    if (!plan) {
      throw new NotFoundException(
        'Bakým planý bulunamadý.',
      );
    }

    return this.prisma.maintenancePlan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });
  }
}
