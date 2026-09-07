import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MaintenancePlanStatus,
  ServiceItemType,
  UserRole,
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
      { type: ServiceItemType.PART, name: 'Motor Yağı', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Yağ Filtresi', quantity: 1 },
      { type: ServiceItemType.LABOR, name: 'Yağ Değişim İşçiliği', quantity: 1 },
    ],
  },
  {
    name: 'Yağ + Filtre Bakımı',
    description: 'Motor yağı ile temel filtrelerin değişimi.',
    items: [
      { type: ServiceItemType.PART, name: 'Motor Yağı', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Yağ Filtresi', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Hava Filtresi', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Polen Filtresi', quantity: 1 },
      { type: ServiceItemType.LABOR, name: 'Periyodik Bakım İşçiliği', quantity: 1 },
    ],
  },
  {
    name: 'Periyodik Bakım',
    description: 'Genel periyodik bakım kontrol ve değişim paketi.',
    items: [
      { type: ServiceItemType.PART, name: 'Motor Yağı', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Yağ Filtresi', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Hava Filtresi', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Polen Filtresi', quantity: 1 },
      { type: ServiceItemType.OTHER, name: 'Sıvı ve Genel Kontroller', quantity: 1 },
      { type: ServiceItemType.LABOR, name: 'Periyodik Bakım İşçiliği', quantity: 1 },
    ],
  },
  {
    name: 'Fren Bakımı',
    description: 'Fren sistemi kontrol ve bakım paketi.',
    items: [
      { type: ServiceItemType.PART, name: 'Fren Balatası', quantity: 1 },
      { type: ServiceItemType.OTHER, name: 'Fren Sistemi Kontrolü', quantity: 1 },
      { type: ServiceItemType.LABOR, name: 'Fren Bakım İşçiliği', quantity: 1 },
    ],
  },
  {
    name: 'Triger Seti Bakımı',
    description: 'Triger seti ve ilgili parçaların değişim paketi.',
    items: [
      { type: ServiceItemType.PART, name: 'Triger Seti', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Devirdaim Pompası', quantity: 1 },
      { type: ServiceItemType.LABOR, name: 'Triger Değişim İşçiliği', quantity: 1 },
    ],
  },
  {
    name: 'Klima Bakımı',
    description: 'Klima sistem kontrolü ve bakım paketi.',
    items: [
      { type: ServiceItemType.OTHER, name: 'Klima Gazı / Sistem Kontrolü', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Polen Filtresi', quantity: 1 },
      { type: ServiceItemType.LABOR, name: 'Klima Bakım İşçiliği', quantity: 1 },
    ],
  },
  {
    name: 'Akü Kontrol / Değişim',
    description: 'Akü test ve değişim paketi.',
    items: [
      { type: ServiceItemType.OTHER, name: 'Akü Testi', quantity: 1 },
      { type: ServiceItemType.PART, name: 'Akü', quantity: 1 },
      { type: ServiceItemType.LABOR, name: 'Akü Değişim İşçiliği', quantity: 1 },
    ],
  },
];

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private branchWhere(
    role: UserRole,
    branchId: string | null,
  ) {
    return role ===
      UserRole.SERVICE_ADVISOR
      ? {
          branchId:
            branchId ??
            '__branch_not_assigned__',
        }
      : {};
  }

  private async resolveVehicle(
    organizationId: string,
    vehicleId: string,
    role: UserRole,
    actorBranchId: string | null,
  ) {
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
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

    if (!vehicle) {
      throw new BadRequestException(
        'Araç bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return vehicle;
  }

  async createRecord(
    organizationId: string,
    actorBranchId: string | null,
    role: UserRole,
    dto: CreateMaintenanceRecordDto,
  ) {
    const vehicle =
      await this.resolveVehicle(
        organizationId,
        dto.vehicleId,
        role,
        actorBranchId,
      );

    let branchId =
      vehicle.branchId ??
      actorBranchId;

    if (dto.serviceOrderId) {
      const serviceOrder =
        await this.prisma.serviceOrder.findFirst({
          where: {
            id: dto.serviceOrderId,
            organizationId,
            vehicleId: dto.vehicleId,
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

      if (!serviceOrder) {
        throw new BadRequestException(
          'İş emri bulunamadı veya araçla eşleşmiyor.',
        );
      }

      branchId =
        serviceOrder.branchId;
    }

    if (!branchId) {
      throw new BadRequestException(
        'Şube seçimi gerekli.',
      );
    }

    const items = dto.items.map(
      (item) => ({
        partId: item.partId,
        name: item.name,
        description:
          item.description,
        quantity:
          item.quantity,
        unitPrice:
          item.unitPrice,
        totalPrice:
          item.quantity *
          item.unitPrice,
      }),
    );

    const totalAmount =
      items.reduce(
        (sum, item) =>
          sum + item.totalPrice,
        0,
      );

    const result =
      await this.prisma.maintenanceRecord.create({
        data: {
          organizationId,
          branchId,
          vehicleId:
            dto.vehicleId,
          serviceOrderId:
            dto.serviceOrderId,
          mileage:
            dto.mileage,
          performedAt:
            dto.performedAt
              ? new Date(
                  dto.performedAt,
                )
              : new Date(),
          notes:
            dto.notes,
          totalAmount,
          items: {
            create: items,
          },
        },
        include: {
          vehicle: true,
          items: true,
          branch: true,
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
          mileage:
            dto.mileage,
        },
      });
    }

    return result;
  }

  async createPlan(
    organizationId: string,
    actorBranchId: string | null,
    role: UserRole,
    dto: CreateMaintenancePlanDto,
  ) {
    const vehicle =
      await this.resolveVehicle(
        organizationId,
        dto.vehicleId,
        role,
        actorBranchId,
      );

    const branchId =
      vehicle.branchId ??
      actorBranchId;

    return this.prisma.maintenancePlan.create({
      data: {
        organizationId,
        branchId,
        vehicleId:
          dto.vehicleId,
        title:
          dto.title,
        category:
          dto.category,
        description:
          dto.description,
        intervalKm:
          dto.intervalKm,
        intervalMonths:
          dto.intervalMonths,
        lastKm:
          vehicle.mileage,
        lastDate:
          new Date(),
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
    role: UserRole,
    branchId: string | null,
    vehicleId?: string,
  ) {
    return this.prisma.maintenanceRecord.findMany({
      where: {
        organizationId,
        vehicleId,
        ...this.branchWhere(
          role,
          branchId,
        ),
      },
      include: {
        vehicle: true,
        items: true,
        branch: true,
      },
      orderBy: {
        performedAt: 'desc',
      },
    });
  }

  findPlans(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
    vehicleId?: string,
  ) {
    return this.prisma.maintenancePlan.findMany({
      where: {
        organizationId,
        vehicleId,
        ...this.branchWhere(
          role,
          branchId,
        ),
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

  async alerts(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
  ) {
    const plans =
      await this.prisma.maintenancePlan.findMany({
        where: {
          organizationId,
          status:
            MaintenancePlanStatus.ACTIVE,
          ...this.branchWhere(
            role,
            branchId,
          ),
        },
        include: {
          vehicle: {
            include: {
              customer: true,
            },
          },
        },
      });

    const now = new Date();
    const soonDate =
      new Date(
        now.getTime() +
          30 *
            24 *
            60 *
            60 *
            1000,
      );

    return plans
      .map((plan) => {
        const currentKm =
          plan.vehicle.mileage;
        const dateOverdue =
          Boolean(
            plan.nextDueDate &&
              plan.nextDueDate <
                now,
          );
        const kmOverdue =
          Boolean(
            plan.nextDueKm !==
              null &&
              plan.nextDueKm !==
                undefined &&
              currentKm >=
                plan.nextDueKm,
          );
        const dateSoon =
          Boolean(
            plan.nextDueDate &&
              plan.nextDueDate >=
                now &&
              plan.nextDueDate <=
                soonDate,
          );
        const kmSoon =
          Boolean(
            plan.nextDueKm !==
              null &&
              plan.nextDueKm !==
                undefined &&
              currentKm <
                plan.nextDueKm &&
              currentKm + 1000 >=
                plan.nextDueKm,
          );

        const alertStatus =
          dateOverdue ||
          kmOverdue
            ? 'OVERDUE'
            : dateSoon ||
                kmSoon
              ? 'DUE_SOON'
              : 'UPCOMING';

        return {
          id: plan.id,
          title:
            plan.title,
          alertStatus,
          nextDueDate:
            plan.nextDueDate,
          nextDueKm:
            plan.nextDueKm,
          currentKm,
          vehicle: {
            id:
              plan.vehicle.id,
            plate:
              plan.vehicle.plate,
            brand:
              plan.vehicle.brand,
            model:
              plan.vehicle.model,
          },
          customer: {
            id:
              plan.vehicle.customer.id,
            firstName:
              plan.vehicle.customer.firstName,
            lastName:
              plan.vehicle.customer.lastName,
            phone:
              plan.vehicle.customer.phone,
          },
        };
      })
      .sort((a, b) => {
        const order:
          Record<string, number> = {
          OVERDUE: 0,
          DUE_SOON: 1,
          UPCOMING: 2,
        };

        return (
          order[a.alertStatus] -
          order[b.alertStatus]
        );
      });
  }

  async completePlan(
    organizationId: string,
    id: string,
    role: UserRole,
    branchId: string | null,
  ) {
    const plan =
      await this.prisma.maintenancePlan.findFirst({
        where: {
          id,
          organizationId,
          ...this.branchWhere(
            role,
            branchId,
          ),
        },
      });

    if (!plan) {
      throw new NotFoundException(
        'Bakım planı bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return this.prisma.maintenancePlan.update({
      where: { id },
      data: {
        status:
          MaintenancePlanStatus.COMPLETED,
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
            create:
              item.items.map(
                (
                  packageItem,
                ) => ({
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
        { active: 'desc' },
        { name: 'asc' },
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
          create:
            dto.items.map(
              (item) => ({
                type:
                  item.type,
                name:
                  item.name,
                description:
                  item.description,
                quantity:
                  item.quantity,
                unitPrice:
                  item.unitPrice,
                vatRate:
                  item.vatRate ??
                  20,
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
      data: { active },
      include: {
        items: true,
      },
    });
  }
}
