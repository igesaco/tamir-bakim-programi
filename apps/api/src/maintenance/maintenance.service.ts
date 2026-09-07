import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ServiceItemType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenancePackageDto } from './dto/create-maintenance-package.dto';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';

const defaultPackages = [
  {
    name: 'Yağ Değişimi',
    description: 'Motor yağı, yağ filtresi ve işçilik.',
    items: [
      {
        type: ServiceItemType.PART,
        name: 'Motor Yağı',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Yağ Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.LABOR,
        name: 'Yağ Değişim İşçiliği',
        quantity: 1,
      },
    ],
  },
  {
    name: 'Yağ + Filtre Bakımı',
    description: 'Motor yağı ile temel filtrelerin değişimi.',
    items: [
      {
        type: ServiceItemType.PART,
        name: 'Motor Yağı',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Yağ Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Hava Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Polen Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.LABOR,
        name: 'Periyodik Bakım İşçiliği',
        quantity: 1,
      },
    ],
  },
  {
    name: 'Periyodik Bakım',
    description: 'Genel periyodik bakım kontrol ve değişim paketi.',
    items: [
      {
        type: ServiceItemType.PART,
        name: 'Motor Yağı',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Yağ Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Hava Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Polen Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.OTHER,
        name: 'Sıvı ve Genel Kontroller',
        quantity: 1,
      },
      {
        type: ServiceItemType.LABOR,
        name: 'Periyodik Bakım İşçiliği',
        quantity: 1,
      },
    ],
  },
  {
    name: 'Fren Bakımı',
    description: 'Fren sistemi kontrol ve bakım paketi.',
    items: [
      {
        type: ServiceItemType.PART,
        name: 'Fren Balatası',
        quantity: 1,
      },
      {
        type: ServiceItemType.OTHER,
        name: 'Fren Sistemi Kontrolü',
        quantity: 1,
      },
      {
        type: ServiceItemType.LABOR,
        name: 'Fren Bakım İşçiliği',
        quantity: 1,
      },
    ],
  },
  {
    name: 'Triger Seti Bakımı',
    description: 'Triger seti ve ilgili parçaların değişim paketi.',
    items: [
      {
        type: ServiceItemType.PART,
        name: 'Triger Seti',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Devirdaim Pompası',
        quantity: 1,
      },
      {
        type: ServiceItemType.LABOR,
        name: 'Triger Değişim İşçiliği',
        quantity: 1,
      },
    ],
  },
  {
    name: 'Klima Bakımı',
    description: 'Klima sistem kontrolü ve bakım paketi.',
    items: [
      {
        type: ServiceItemType.OTHER,
        name: 'Klima Gazı / Sistem Kontrolü',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Polen Filtresi',
        quantity: 1,
      },
      {
        type: ServiceItemType.LABOR,
        name: 'Klima Bakım İşçiliği',
        quantity: 1,
      },
    ],
  },
  {
    name: 'Akü Kontrol / Değişim',
    description: 'Akü test ve değişim paketi.',
    items: [
      {
        type: ServiceItemType.OTHER,
        name: 'Akü Testi',
        quantity: 1,
      },
      {
        type: ServiceItemType.PART,
        name: 'Akü',
        quantity: 1,
      },
      {
        type: ServiceItemType.LABOR,
        name: 'Akü Değişim İşçiliği',
        quantity: 1,
      },
    ],
  },
];

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createRecord(
    organizationId: string,
    branchId: string | null,
    dto: CreateMaintenanceRecordDto,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Şube seçimi gerekli.',
      );
    }

    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id: dto.vehicleId,
          organizationId,
        },
      });

    if (!vehicle) {
      throw new BadRequestException(
        'Araç bulunamadı.',
      );
    }

    const items = dto.items.map(
      (item) => ({
        partId: item.partId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice:
          item.quantity *
          item.unitPrice,
      }),
    );

    const totalAmount = items.reduce(
      (sum, item) =>
        sum + item.totalPrice,
      0,
    );

    const result =
      await this.prisma.maintenanceRecord.create({
        data: {
          organizationId,
          branchId,
          vehicleId: dto.vehicleId,
          serviceOrderId:
            dto.serviceOrderId,
          mileage: dto.mileage,
          performedAt:
            dto.performedAt
              ? new Date(
                  dto.performedAt,
                )
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

    if (
      dto.mileage >
      vehicle.mileage
    ) {
      await this.prisma.vehicle.update({
        where: {
          id: dto.vehicleId,
        },
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
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id: dto.vehicleId,
          organizationId,
        },
      });

    if (!vehicle) {
      throw new BadRequestException(
        'Araç bulunamadı.',
      );
    }

    return this.prisma.maintenancePlan.create({
      data: {
        organizationId,
        branchId,
        vehicleId: dto.vehicleId,
        title: dto.title,
        category: dto.category,
        description:
          dto.description,
        intervalKm:
          dto.intervalKm,
        intervalMonths:
          dto.intervalMonths,
        lastKm: vehicle.mileage,
        lastDate: new Date(),
        nextDueKm:
          dto.nextDueKm,
        nextDueDate:
          dto.nextDueDate
            ? new Date(
                dto.nextDueDate,
              )
            : null,
        estimatedPriceMin:
          dto.estimatedPriceMin,
        estimatedPriceMax:
          dto.estimatedPriceMax,
      },
      include: {
        vehicle: true,
      },
    });
  }

  findRecords(
    organizationId: string,
    vehicleId?: string,
  ) {
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

  findPlans(
    organizationId: string,
    vehicleId?: string,
  ) {
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

  async completePlan(
    organizationId: string,
    id: string,
  ) {
    const plan =
      await this.prisma.maintenancePlan.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!plan) {
      throw new NotFoundException(
        'Bakım planı bulunamadı.',
      );
    }

    return this.prisma.maintenancePlan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });
  }

  private async ensureDefaultPackages(
    organizationId: string,
  ) {
    const count =
      await this.prisma.maintenancePackage.count({
        where: {
          organizationId,
        },
      });

    if (count > 0) {
      return;
    }

    for (const item of defaultPackages) {
      await this.prisma.maintenancePackage.create({
        data: {
          organizationId,
          name: item.name,
          description:
            item.description,
          items: {
            create: item.items.map(
              (packageItem) => ({
                type:
                  packageItem.type,
                name:
                  packageItem.name,
                quantity:
                  packageItem.quantity,
                unitPrice: 0,
                vatRate: 20,
              }),
            ),
          },
        },
      });
    }
  }

  async findPackages(
    organizationId: string,
  ) {
    await this.ensureDefaultPackages(
      organizationId,
    );

    return this.prisma.maintenancePackage.findMany({
      where: {
        organizationId,
      },
      include: {
        items: true,
      },
      orderBy: [
        {
          active: 'desc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async createPackage(
    organizationId: string,
    dto: CreateMaintenancePackageDto,
  ) {
    if (!dto.items.length) {
      throw new BadRequestException(
        'Bakım paketinde en az bir kalem bulunmalıdır.',
      );
    }

    const existing =
      await this.prisma.maintenancePackage.findFirst({
        where: {
          organizationId,
          name: dto.name,
        },
      });

    if (existing) {
      throw new BadRequestException(
        'Bu isimde bir bakım paketi zaten mevcut.',
      );
    }

    return this.prisma.maintenancePackage.create({
      data: {
        organizationId,
        name: dto.name,
        description:
          dto.description,
        items: {
          create: dto.items.map(
            (item) => ({
              type: item.type,
              name: item.name,
              description:
                item.description,
              quantity:
                item.quantity,
              unitPrice:
                item.unitPrice,
              vatRate:
                item.vatRate ?? 20,
            }),
          ),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async setPackageActive(
    organizationId: string,
    id: string,
    active: boolean,
  ) {
    const maintenancePackage =
      await this.prisma.maintenancePackage.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!maintenancePackage) {
      throw new NotFoundException(
        'Bakım paketi bulunamadı.',
      );
    }

    return this.prisma.maintenancePackage.update({
      where: { id },
      data: {
        active,
      },
      include: {
        items: true,
      },
    });
  }
}
