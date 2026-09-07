import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  ServiceItemType,
  ServiceOrderStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { CreateServiceOrderItemDto } from './dto/create-service-order-item.dto';

function money(value: number) {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100,
    ) / 100
  );
}

const TECHNICIAN_ALLOWED_STATUSES =
  new Set<ServiceOrderStatus>([
    ServiceOrderStatus.ACCEPTED,
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.PART_WAITING,
    ServiceOrderStatus.QUALITY_CONTROL,
    ServiceOrderStatus.READY,
  ]);

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async resolveBranch(
    organizationId: string,
    actorBranchId: string | null,
    actorRole: UserRole,
    requestedBranchId?: string,
  ) {
    let branchId = actorBranchId;

    if (
      (
        actorRole === UserRole.OWNER ||
        actorRole === UserRole.MANAGER
      ) &&
      requestedBranchId
    ) {
      branchId = requestedBranchId;
    }

    if (
      actorRole === UserRole.SERVICE_ADVISOR &&
      requestedBranchId &&
      requestedBranchId !== actorBranchId
    ) {
      throw new ForbiddenException(
        'Servis danışmanı yalnızca kendi şubesinde işlem yapabilir.',
      );
    }

    if (!branchId) {
      throw new BadRequestException(
        'İşlem için şube seçimi gerekli.',
      );
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId,
        active: true,
      },
    });

    if (!branch) {
      throw new BadRequestException(
        'Geçerli ve aktif bir şube seçiniz.',
      );
    }

    return branchId;
  }

  private async validateTechnician(
    organizationId: string,
    branchId: string,
    technicianId: string,
  ) {
    const technician =
      await this.prisma.user.findFirst({
        where: {
          id: technicianId,
          organizationId,
          role: UserRole.TECHNICIAN,
          active: true,
          branchId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          branchId: true,
        },
      });

    if (!technician) {
      throw new BadRequestException(
        'Seçilen teknisyen aktif değil veya iş emriyle aynı şubede değil.',
      );
    }

    return technician;
  }

  private buildAccessWhere(
    organizationId: string,
    role: UserRole,
    userId: string,
    branchId: string | null,
  ) {
    const where: Record<string, any> = {
      organizationId,
    };

    if (role === UserRole.TECHNICIAN) {
      where.assignedTechnicianId = userId;

      if (branchId) {
        where.branchId = branchId;
      }

      return where;
    }

    if (role === UserRole.SERVICE_ADVISOR) {
      if (!branchId) {
        throw new BadRequestException(
          'Servis danışmanı için şube ataması gerekli.',
        );
      }

      where.branchId = branchId;
    }

    return where;
  }

  async create(
    organizationId: string,
    actorBranchId: string | null,
    actorRole: UserRole,
    dto: CreateServiceOrderDto,
  ) {
    const branchId = await this.resolveBranch(
      organizationId,
      actorBranchId,
      actorRole,
      dto.branchId,
    );

    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id: dto.vehicleId,
          organizationId,
          customerId: dto.customerId,
        },
      });

    if (!vehicle) {
      throw new BadRequestException(
        'Müşteri veya araç bilgisi geçersiz.',
      );
    }

    if (dto.assignedTechnicianId) {
      await this.validateTechnician(
        organizationId,
        branchId,
        dto.assignedTechnicianId,
      );
    }

    const orderNumber =
      'SO-' +
      new Date()
        .toISOString()
        .replace(/\D/g, '')
        .slice(0, 14) +
      '-' +
      Math.floor(
        1000 + Math.random() * 9000,
      );

    return this.prisma.serviceOrder.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        assignedTechnicianId:
          dto.assignedTechnicianId,
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

  findAll(
    organizationId: string,
    role: UserRole,
    userId: string,
    branchId: string | null,
  ) {
    const where = this.buildAccessWhere(
      organizationId,
      role,
      userId,
      branchId,
    );

    if (role === UserRole.TECHNICIAN) {
      return this.prisma.serviceOrder.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          mileage: true,
          complaint: true,
          internalNote: true,
          estimatedDeliveryAt: true,
          status: true,
          createdAt: true,
          branchId: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              plate: true,
              brand: true,
              model: true,
              modelYear: true,
            },
          },
          assignedTechnician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return this.prisma.serviceOrder.findMany({
      where,
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

  async findOne(
    organizationId: string,
    id: string,
    role: UserRole,
    userId: string,
    branchId: string | null,
  ) {
    const where = {
      id,
      ...this.buildAccessWhere(
        organizationId,
        role,
        userId,
        branchId,
      ),
    };

    if (role === UserRole.TECHNICIAN) {
      const technicianOrder =
        await this.prisma.serviceOrder.findFirst({
          where,
          select: {
            id: true,
            orderNumber: true,
            mileage: true,
            complaint: true,
            internalNote: true,
            estimatedDeliveryAt: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            branchId: true,
            assignedTechnicianId: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            vehicle: {
              select: {
                plate: true,
                brand: true,
                model: true,
                modelYear: true,
              },
            },
            assignedTechnician: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

      if (!technicianOrder) {
        throw new NotFoundException(
          'İş emri bulunamadı veya bu iş emrine erişim yetkiniz yok.',
        );
      }

      return technicianOrder;
    }

    const order =
      await this.prisma.serviceOrder.findFirst({
        where,
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
      throw new NotFoundException(
        'İş emri bulunamadı veya bu iş emrine erişim yetkiniz yok.',
      );
    }

    return order;
  }

  async assignTechnician(
    organizationId: string,
    id: string,
    technicianId: string | null,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    const order =
      await this.prisma.serviceOrder.findFirst({
        where: {
          id,
          organizationId,
          ...(actorRole ===
            UserRole.SERVICE_ADVISOR
            ? {
                branchId:
                  actorBranchId ??
                  '__branch_not_assigned__',
              }
            : {}),
        },
      });

    if (!order) {
      throw new NotFoundException(
        'İş emri bulunamadı veya bu iş emrine erişim yetkiniz yok.',
      );
    }

    if (technicianId) {
      await this.validateTechnician(
        organizationId,
        order.branchId,
        technicianId,
      );
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        assignedTechnicianId:
          technicianId,
      },
      include: {
        customer: true,
        vehicle: true,
        assignedTechnician: true,
      },
    });
  }

  private async findOfficeOrder(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    const order =
      await this.prisma.serviceOrder.findFirst({
        where: {
          id,
          organizationId,
          ...(actorRole ===
          UserRole.SERVICE_ADVISOR
            ? {
                branchId:
                  actorBranchId ??
                  '__branch_not_assigned__',
              }
            : {}),
        },
      });

    if (!order) {
      throw new NotFoundException(
        'İş emri bulunamadı veya bu iş emrine erişim yetkiniz yok.',
      );
    }

    return order;
  }

  async availableParts(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    const order =
      await this.findOfficeOrder(
        organizationId,
        id,
        actorRole,
        actorBranchId,
      );

    const inventory =
      await this.prisma.inventory.findMany({
        where: {
          organizationId,
          branchId: order.branchId,
          quantity: {
            gt: 0,
          },
          part: {
            active: true,
          },
        },
        include: {
          part: true,
        },
        orderBy: {
          part: {
            name: 'asc',
          },
        },
      });

    return inventory.map((item) => ({
      inventoryId: item.id,
      partId: item.partId,
      name: item.part.name,
      sku: item.part.sku,
      oemCode: item.part.oemCode,
      barcode: item.part.barcode,
      brand: item.part.brand,
      unit: item.part.unit,
      quantity: item.quantity,
      salePrice: item.part.salePrice,
      purchasePrice: item.part.purchasePrice,
    }));
  }

  async addItem(
    organizationId: string,
    id: string,
    actorId: string,
    actorRole: UserRole,
    actorBranchId: string | null,
    dto: CreateServiceOrderItemDto,
  ) {
    const order =
      await this.findOfficeOrder(
        organizationId,
        id,
        actorRole,
        actorBranchId,
      );

    const quantity =
      Number(dto.quantity);

    let unitPrice =
      dto.unitPrice === undefined
        ? undefined
        : money(
            Number(
              dto.unitPrice,
            ),
          );

    const discountAmount =
      money(
        Number(
          dto.discountAmount ??
            0,
        ),
      );

    const vatRate =
      Number(
        dto.vatRate ?? 20,
      );

    const calculateTotals = (
      price: number,
    ) => {
      const baseTotal =
        money(
          quantity * price,
        );

      if (
        discountAmount >
        baseTotal
      ) {
        throw new BadRequestException(
          'İndirim tutarı satır toplamından büyük olamaz.',
        );
      }

      const totalPrice =
        money(
          baseTotal -
            discountAmount,
        );

      const vatAmount =
        money(
          totalPrice *
            (vatRate / 100),
        );

      const grossTotal =
        money(
          totalPrice +
            vatAmount,
        );

      return {
        totalPrice,
        vatAmount,
        grossTotal,
      };
    };

    if (dto.partId) {
      if (
        dto.type !==
        ServiceItemType.PART
      ) {
        throw new BadRequestException(
          'Stok parçası yalnızca parça türünde eklenebilir.',
        );
      }

      return this.prisma.$transaction(
        async (tx) => {
          const inventory =
            await tx.inventory.findUnique({
              where: {
                branchId_partId: {
                  branchId:
                    order.branchId,
                  partId:
                    dto.partId!,
                },
              },
              include: {
                part: true,
              },
            });

          if (
            !inventory ||
            inventory.organizationId !==
              organizationId ||
            inventory.part
              .organizationId !==
              organizationId ||
            !inventory.part.active
          ) {
            throw new NotFoundException(
              'Seçilen parça bu şubenin stoklarında bulunamadı.',
            );
          }

          if (
            Number(
              inventory.quantity,
            ) < quantity
          ) {
            throw new BadRequestException(
              'Seçilen parça için yeterli stok bulunmuyor.',
            );
          }

          if (
            unitPrice === undefined
          ) {
            unitPrice =
              money(
                Number(
                  inventory.part
                    .salePrice,
                ),
              );
          }

          const totals =
            calculateTotals(
              unitPrice,
            );

          const item =
            await tx.serviceOrderItem.create({
              data: {
                serviceOrderId:
                  order.id,
                partId:
                  dto.partId,
                type:
                  ServiceItemType.PART,
                name:
                  dto.name.trim() ||
                  inventory.part.name,
                description:
                  dto.description?.trim(),
                quantity,
                unitPrice,
                discountAmount,
                totalPrice:
                  totals.totalPrice,
                vatRate,
                vatAmount:
                  totals.vatAmount,
                grossTotal:
                  totals.grossTotal,
              },
              include: {
                part: true,
              },
            });

          await tx.inventory.update({
            where: {
              branchId_partId: {
                branchId:
                  order.branchId,
                partId:
                  dto.partId!,
              },
            },
            data: {
              quantity: {
                decrement:
                  quantity,
              },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              organizationId,
              branchId:
                order.branchId,
              partId:
                dto.partId!,
              serviceOrderId:
                order.id,
              createdById:
                actorId,
              type:
                InventoryMovementType.OUT,
              quantity,
              unitCost:
                inventory.part
                  .purchasePrice,
              note:
                `SERVICE_ORDER_ITEM:${item.id}`,
            },
          });

          return item;
        },
      );
    }

    if (
      unitPrice === undefined
    ) {
      throw new BadRequestException(
        'Birim fiyat bilgisi gerekli.',
      );
    }

    const totals =
      calculateTotals(
        unitPrice,
      );

    return this.prisma.serviceOrderItem.create({
      data: {
        serviceOrderId:
          order.id,
        type:
          dto.type,
        name:
          dto.name.trim(),
        description:
          dto.description?.trim(),
        quantity,
        unitPrice,
        discountAmount,
        totalPrice:
          totals.totalPrice,
        vatRate,
        vatAmount:
          totals.vatAmount,
        grossTotal:
          totals.grossTotal,
      },
      include: {
        part: true,
      },
    });
  }

  async setItemComplete(
    organizationId: string,
    id: string,
    itemId: string,
    actorRole: UserRole,
    actorBranchId: string | null,
    completed: boolean,
  ) {
    const order =
      await this.findOfficeOrder(
        organizationId,
        id,
        actorRole,
        actorBranchId,
      );

    const item =
      await this.prisma.serviceOrderItem.findFirst({
        where: {
          id: itemId,
          serviceOrderId:
            order.id,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'İş emri kalemi bulunamadı.',
      );
    }

    return this.prisma.serviceOrderItem.update({
      where: {
        id: itemId,
      },
      data: {
        completed:
          Boolean(completed),
      },
      include: {
        part: true,
      },
    });
  }

  async removeItem(
    organizationId: string,
    id: string,
    itemId: string,
    actorId: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    const order =
      await this.findOfficeOrder(
        organizationId,
        id,
        actorRole,
        actorBranchId,
      );

    const item =
      await this.prisma.serviceOrderItem.findFirst({
        where: {
          id: itemId,
          serviceOrderId:
            order.id,
        },
        include: {
          part: true,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'İş emri kalemi bulunamadı.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        if (item.partId) {
          const trackedMovement =
            await tx.inventoryMovement.findFirst({
              where: {
                organizationId,
                branchId:
                  order.branchId,
                partId:
                  item.partId,
                serviceOrderId:
                  order.id,
                type:
                  InventoryMovementType.OUT,
                note:
                  `SERVICE_ORDER_ITEM:${item.id}`,
              },
            });

          if (trackedMovement) {
            await tx.inventory.upsert({
              where: {
                branchId_partId: {
                  branchId:
                    order.branchId,
                  partId:
                    item.partId,
                },
              },
              create: {
                organizationId,
                branchId:
                  order.branchId,
                partId:
                  item.partId,
                quantity:
                  item.quantity,
                minQuantity:
                  item.part
                    ?.minimumStock ??
                  0,
              },
              update: {
                quantity: {
                  increment:
                    item.quantity,
                },
              },
            });

            await tx.inventoryMovement.create({
              data: {
                organizationId,
                branchId:
                  order.branchId,
                partId:
                  item.partId,
                serviceOrderId:
                  order.id,
                createdById:
                  actorId,
                type:
                  InventoryMovementType.RETURN,
                quantity:
                  item.quantity,
                unitCost:
                  item.part
                    ?.purchasePrice,
                note:
                  `SERVICE_ORDER_ITEM_RETURN:${item.id}`,
              },
            });
          }
        }

        await tx.serviceOrderItem.delete({
          where: {
            id: item.id,
          },
        });

        return {
          success: true,
          restoredStock:
            Boolean(
              item.partId,
            ),
        };
      },
    );
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: ServiceOrderStatus,
    actorRole: UserRole,
    actorId: string,
    actorBranchId: string | null,
  ) {
    const order =
      await this.prisma.serviceOrder.findFirst({
        where: {
          id,
          ...this.buildAccessWhere(
            organizationId,
            actorRole,
            actorId,
            actorBranchId,
          ),
        },
      });

    if (!order) {
      throw new NotFoundException(
        'İş emri bulunamadı veya bu iş emrine erişim yetkiniz yok.',
      );
    }

    if (
      actorRole ===
        UserRole.TECHNICIAN &&
      !TECHNICIAN_ALLOWED_STATUSES.has(
        status,
      )
    ) {
      throw new ForbiddenException(
        'Teknisyen bu servis durumunu kullanamaz.',
      );
    }

    if (
      status !==
      ServiceOrderStatus.DELIVERED
    ) {
      return this.prisma.serviceOrder.update({
        where: { id },
        data: {
          status,
        },
        include: {
          assignedTechnician: true,
        },
      });
    }

    const deliveredAt =
      new Date();

    return this.prisma.$transaction(
      async (tx) => {
        const updatedOrder =
          await tx.serviceOrder.update({
            where: { id },
            data: {
              status:
                ServiceOrderStatus.DELIVERED,
              deliveredAt,
            },
            include: {
              assignedTechnician: true,
              items: true,
            },
          });

        await tx.vehicle.updateMany({
          where: {
            id:
              order.vehicleId,
            organizationId,
            mileage: {
              lt: order.mileage,
            },
          },
          data: {
            mileage:
              order.mileage,
          },
        });

        const existingRecord =
          await tx.maintenanceRecord.findUnique({
            where: {
              serviceOrderId:
                id,
            },
          });

        if (!existingRecord) {
          const totalAmount =
            updatedOrder.items.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.totalPrice,
                ),
              0,
            );

          await tx.maintenanceRecord.create({
            data: {
              organizationId,
              branchId:
                order.branchId,
              vehicleId:
                order.vehicleId,
              serviceOrderId:
                order.id,
              mileage:
                order.mileage,
              performedAt:
                deliveredAt,
              totalAmount,
              notes:
                order.internalNote ??
                order.complaint,
              items: {
                create:
                  updatedOrder.items.map(
                    (item) => ({
                      partId:
                        item.partId,
                      name:
                        item.name,
                      description:
                        item.description,
                      quantity:
                        item.quantity,
                      unitPrice:
                        item.unitPrice,
                      totalPrice:
                        item.totalPrice,
                    }),
                  ),
              },
            },
          });
        }

        return updatedOrder;
      },
    );
  }
}
