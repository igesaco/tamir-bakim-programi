import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  NotificationChannel,
  NotificationStatus,
  ServiceItemType,
  ServiceOrderStatus,
  ServiceOrderWorkLogType,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { CreateServiceOrderItemDto } from './dto/create-service-order-item.dto';
import { CreateServiceOrderWorkLogDto } from './dto/create-service-order-work-log.dto';

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
            items: {
              select: {
                id: true,
                type: true,
                name: true,
                description: true,
                quantity: true,
                completed: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
            media: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            workLogs: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
                part: {
                  select: {
                    id: true,
                    name: true,
                    brand: true,
                    unit: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
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
          workLogs: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
              part: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
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

  async findWorkLogs(
    organizationId: string,
    id: string,
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
        select: {
          id: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'İş emri bulunamadı veya bu iş emrine erişim yetkiniz yok.',
      );
    }

    return this.prisma.serviceOrderWorkLog.findMany({
      where: {
        organizationId,
        serviceOrderId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        part: {
          select: {
            id: true,
            name: true,
            brand: true,
            unit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addWorkLog(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorId: string,
    actorBranchId: string | null,
    dto: CreateServiceOrderWorkLogDto,
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
        select: {
          id: true,
          branchId: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'İş emri bulunamadı veya bu iş emrine erişim yetkiniz yok.',
      );
    }

    const note =
      dto.note?.trim() ||
      null;

    const partNameInput =
      dto.partName?.trim() ||
      null;

    if (
      dto.type ===
        ServiceOrderWorkLogType.NOTE &&
      !note
    ) {
      throw new BadRequestException(
        'Teknik işlem notu gerekli.',
      );
    }

    let partId:
      | string
      | null =
      dto.partId ?? null;

    let partName:
      | string
      | null =
      partNameInput;

    if (
      dto.type ===
      ServiceOrderWorkLogType.PART_USED
    ) {
      if (
        !partId &&
        !partName
      ) {
        throw new BadRequestException(
          'Kullanılan parça için parça seçimi veya parça adı gerekli.',
        );
      }

      if (
        !dto.quantity ||
        Number(dto.quantity) <= 0
      ) {
        throw new BadRequestException(
          'Kullanılan parça miktarı gerekli.',
        );
      }

      if (partId) {
        const part =
          await this.prisma.part.findFirst({
            where: {
              id: partId,
              organizationId,
              active: true,
            },
            select: {
              id: true,
              name: true,
            },
          });

        if (!part) {
          throw new BadRequestException(
            'Kullanılan parça bulunamadı.',
          );
        }

        partName =
          part.name;
      }
    } else {
      partId = null;
      partName = null;
    }

    return this.prisma.serviceOrderWorkLog.create({
      data: {
        organizationId,
        serviceOrderId: id,
        userId: actorId,
        type: dto.type,
        note,
        partId,
        partName,
        quantity:
          dto.quantity === undefined
            ? null
            : Number(
                dto.quantity,
              ),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        part: {
          select: {
            id: true,
            name: true,
            brand: true,
            unit: true,
          },
        },
      },
    });
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
    actorId: string,
    actorBranchId: string | null,
    completed: boolean,
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
        select: {
          id: true,
          status: true,
          customerId: true,
          branchId: true,
          vehicle: {
            select: {
              plate: true,
            },
          },
        },
      });

    if (!order) {
      throw new NotFoundException(
        'İş emri bulunamadı veya erişim yetkiniz yok.',
      );
    }

    if (
      actorRole ===
        UserRole.TECHNICIAN &&
      ![
        ServiceOrderStatus.IN_PROGRESS,
        ServiceOrderStatus.PART_WAITING,
        ServiceOrderStatus.QUALITY_CONTROL,
      ].includes(
        order.status,
      )
    ) {
      throw new BadRequestException(
        'İşlem kalemleri yalnızca onaylanmış ve başlatılmış iş emrinde güncellenebilir.',
      );
    }

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

    return this.prisma.$transaction(
      async (tx) => {
        const updatedItem =
          await tx.serviceOrderItem.update({
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

        if (
          completed &&
          actorRole ===
            UserRole.TECHNICIAN
        ) {
          await tx.serviceOrderWorkLog.create({
            data: {
              organizationId,
              serviceOrderId:
                order.id,
              userId:
                actorId,
              type:
                ServiceOrderWorkLogType.NOTE,
              note:
                `İşlem tamamlandı: ${item.name}`,
            },
          });

          const remaining =
            await tx.serviceOrderItem.count({
              where: {
                serviceOrderId:
                  order.id,
                completed:
                  false,
              },
            });

          if (
            remaining === 0 &&
            order.status !==
              ServiceOrderStatus.QUALITY_CONTROL
          ) {
            await tx.serviceOrder.update({
              where: {
                id: order.id,
              },
              data: {
                status:
                  ServiceOrderStatus.QUALITY_CONTROL,
              },
            });

            const customer =
              await tx.customer.findUnique({
                where: {
                  id:
                    order.customerId,
                },
                select: {
                  portalEnabled:
                    true,
                },
              });

            if (
              customer?.portalEnabled
            ) {
              await tx.notification.create({
                data: {
                  organizationId,
                  branchId:
                    order.branchId,
                  customerId:
                    order.customerId,
                  serviceOrderId:
                    order.id,
                  channel:
                    NotificationChannel.IN_APP,
                  status:
                    NotificationStatus.PENDING,
                  title:
                    'Teknik işlemler tamamlandı',
                  message:
                    `${order.vehicle.plate} plakalı aracınızdaki planlanan işlemler tamamlandı. Araç kalite kontrol aşamasına geçti.`,
                },
              });
            }
          }
        }

        return updatedItem;
      },
    );
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
      actorRole ===
        UserRole.TECHNICIAN
    ) {
      const allowedTransitions:
        Partial<
          Record<
            ServiceOrderStatus,
            ServiceOrderStatus[]
          >
        > = {
        [ServiceOrderStatus.APPROVED]: [
          ServiceOrderStatus.IN_PROGRESS,
        ],
        [ServiceOrderStatus.IN_PROGRESS]: [
          ServiceOrderStatus.PART_WAITING,
          ServiceOrderStatus.QUALITY_CONTROL,
        ],
        [ServiceOrderStatus.PART_WAITING]: [
          ServiceOrderStatus.IN_PROGRESS,
          ServiceOrderStatus.QUALITY_CONTROL,
        ],
        [ServiceOrderStatus.QUALITY_CONTROL]: [
          ServiceOrderStatus.READY,
        ],
        [ServiceOrderStatus.READY]: [],
      };

      if (
        !(
          allowedTransitions[
            order.status
          ] || []
        ).includes(status)
      ) {
        throw new BadRequestException(
          'Bu iş emri mevcut aşamadan seçilen aşamaya geçirilemez. Önce gerekli onay ve önceki servis adımları tamamlanmalıdır.',
        );
      }
    }

    if (
      status !==
      ServiceOrderStatus.DELIVERED
    ) {
      return this.prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.serviceOrder.update({
              where: { id },
              data: {
                status,
              },
              include: {
                assignedTechnician: true,
                vehicle: {
                  select: {
                    plate: true,
                  },
                },
              },
            });

          const customerMessages:
            Partial<
              Record<
                ServiceOrderStatus,
                {
                  title: string;
                  message: string;
                }
              >
            > = {
            [ServiceOrderStatus.IN_PROGRESS]: {
              title:
                'Servis işlemi başladı',
              message:
                `${updated.vehicle.plate} plakalı aracınızın servis işlemlerine başlandı.`,
            },
            [ServiceOrderStatus.PART_WAITING]: {
              title:
                'Parça tedariki bekleniyor',
              message:
                `${updated.vehicle.plate} plakalı aracınız için gerekli parça / malzeme tedariki bekleniyor.`,
            },
            [ServiceOrderStatus.QUALITY_CONTROL]: {
              title:
                'Teknik işlemler tamamlandı',
              message:
                `${updated.vehicle.plate} plakalı aracınız kalite kontrol ve son kontrol aşamasındadır.`,
            },
            [ServiceOrderStatus.READY]: {
              title:
                'Aracınız teslimata hazır',
              message:
                `${updated.vehicle.plate} plakalı aracınızın servis işlemleri tamamlandı ve teslimata hazırdır.`,
            },
            [ServiceOrderStatus.PAYMENT_WAITING]: {
              title:
                'Ödeme bekleniyor',
              message:
                `${updated.vehicle.plate} plakalı aracınız için ödeme / tahsilat işlemi bekleniyor.`,
            },
          };

          const customerMessage =
            customerMessages[
              status
            ];

          if (customerMessage) {
            const customer =
              await tx.customer.findUnique({
                where: {
                  id:
                    order.customerId,
                },
                select: {
                  portalEnabled:
                    true,
                },
              });

            if (
              customer?.portalEnabled
            ) {
              await tx.notification.create({
                data: {
                  organizationId,
                  branchId:
                    order.branchId,
                  customerId:
                    order.customerId,
                  serviceOrderId:
                    order.id,
                  channel:
                    NotificationChannel.IN_APP,
                  status:
                    NotificationStatus.PENDING,
                  title:
                    customerMessage.title,
                  message:
                    customerMessage.message,
                },
              });
            }
          }

          return updated;
        },
      );
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
              (sum, item) => {
                const gross =
                  Number(
                    item.grossTotal ??
                      0,
                  );

                return (
                  sum +
                  (gross > 0
                    ? gross
                    : Number(
                        item.totalPrice,
                      ) +
                      Number(
                        item.vatAmount ??
                          0,
                      ))
                );
              },
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

        const deliveredCustomer =
          await tx.customer.findUnique({
            where: {
              id:
                order.customerId,
            },
            select: {
              portalEnabled: true,
            },
          });

        if (
          deliveredCustomer?.portalEnabled
        ) {
          const deliveredVehicle =
            await tx.vehicle.findUnique({
              where: {
                id:
                  order.vehicleId,
              },
              select: {
                plate: true,
              },
            });

          await tx.notification.create({
            data: {
              organizationId,
              branchId:
                order.branchId,
              customerId:
                order.customerId,
              serviceOrderId:
                order.id,
              channel:
                NotificationChannel.IN_APP,
              status:
                NotificationStatus.PENDING,
              title:
                'Araç teslim edildi',
              message:
                `${deliveredVehicle?.plate || 'Aracınız'} için servis kaydı tamamlandı ve bakım geçmişine işlendi.`,
            },
          });
        }

        return updatedOrder;
      },
    );
  }
}
