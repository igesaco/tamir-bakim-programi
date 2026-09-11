import { finishPlan } from '../workflow/maintenance';
import { itemApproved } from '../workflow/item-approval';
import { atomic } from '../workflow/transaction';
import { notifyOffice } from '../workflow/notifications';
import { orderBalance, itemTotal } from '../workflow/finance';
import { assertOpen, assertTransition } from '../workflow/order-rules';
import { issueItem } from '../workflow/stock';
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
        quotes: true,
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
            vehicleId: true,
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

    return atomic(this.prisma, organizationId, async tx => {
    const freshOrder = await tx.serviceOrder.findFirstOrThrow({ where: { id, organizationId }, include: { items: true, quotes: true } });
    assertOpen(freshOrder.status);
    if (dto.type === ServiceOrderWorkLogType.PART_USED) {
      const matches = freshOrder.items.filter(item => (partId ? item.partId === partId : item.name === partName) && Number(item.quantity) === Number(dto.quantity));
      if (matches.length > 1) throw new BadRequestException('Aynı parçadan birden fazla kalem var. İşlem listesindeki ilgili kalemi tamamlayın.');
      const item = matches[0];
      if (item && (!freshOrder.quotes.length || await itemApproved(tx, organizationId, item)) && ['IN_PROGRESS','PART_WAITING'].includes(freshOrder.status)) {
        await issueItem(tx, organizationId, freshOrder.branchId, item, actorId);
        if (item.completed) return { success: true, alreadyRecorded: true };
        await tx.serviceOrderItem.update({ where: { id: item.id }, data: { completed: true } });
      } else {
        if (!item) await tx.serviceOrderItem.create({ data: { serviceOrderId: id, partId, type: ServiceItemType.PART,
          name: partName!, quantity: Number(dto.quantity), unitPrice: 0, totalPrice: 0, description: note } });
        await notifyOffice(tx, organizationId, freshOrder.branchId, id, 'Ek parça talebi', `${partName}: ${dto.quantity}. Fiyatlandırma ve müşteri onayı bekliyor.`, true);
      }
    }
    return tx.serviceOrderWorkLog.create({
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

    return this.prisma.$transaction(
      async (tx) => {
        const updated =
          await tx.serviceOrder.update({
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

        if (technicianId) {
          await tx.notification.create({
            data: {
              organizationId,
              branchId:
                order.branchId,
              userId:
                technicianId,
              serviceOrderId:
                order.id,
              channel:
                NotificationChannel.IN_APP,
              status:
                NotificationStatus.PENDING,
              title:
                order.status ===
                  ServiceOrderStatus.APPROVED
                  ? 'Onaylı iş emri size atandı'
                  : 'Yeni iş emri size atandı',
              message:
                order.status ===
                  ServiceOrderStatus.APPROVED
                  ? `${updated.vehicle.plate} plakalı ${order.orderNumber} iş emri onaylandı. İşleme başlayabilirsiniz.`
                  : `${updated.vehicle.plate} plakalı ${order.orderNumber} iş emri size atandı.`,
            },
          });
        }

        return updated;
      },
    );
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

  async addItem(organizationId: string, id: string, actorId: string, actorRole: UserRole,
    actorBranchId: string | null, dto: CreateServiceOrderItemDto) {
    await this.findOfficeOrder(organizationId, id, actorRole, actorBranchId);
    return atomic(this.prisma, organizationId, async tx => {
      const order = await tx.serviceOrder.findFirstOrThrow({ where: { id, organizationId } });
      assertOpen(order.status);
      const part = dto.partId ? await tx.part.findFirst({ where: { id: dto.partId, organizationId, active: true } }) : null;
      if (dto.partId && (!part || dto.type !== ServiceItemType.PART)) throw new BadRequestException('Geçerli stok parçası seçin.');
      const quantity = Number(dto.quantity);
      const unitPrice = money(Number(dto.unitPrice ?? part?.salePrice ?? 0));
      const discountAmount = money(Number(dto.discountAmount || 0));
      const totalPrice = money(quantity * unitPrice - discountAmount);
      if (!Number.isFinite(totalPrice) || totalPrice < 0 || quantity <= 0) throw new BadRequestException('Kalem tutarı veya miktarı geçersiz.');
      const vatRate = Number(dto.vatRate ?? 20);
      const vatAmount = money(totalPrice * vatRate / 100);
      const item = await tx.serviceOrderItem.create({ data: { serviceOrderId: id, partId: part?.id,
        type: dto.type, name: dto.name.trim() || part?.name || '', description: dto.description?.trim(),
        quantity, unitPrice, discountAmount, totalPrice, vatRate, vatAmount, grossTotal: money(totalPrice + vatAmount) }, include: { part: true } });
      await notifyOffice(tx, organizationId, order.branchId, id, 'İşlem listesine kalem eklendi', `${item.name}: fiyatlandırma ve onay kapsamını kontrol edin.`);
      return item;
    });
  }

  setItemComplete(organizationId: string, id: string, itemId: string, actorRole: UserRole,
    actorId: string, actorBranchId: string | null, completed: boolean) {
    if (typeof completed !== 'boolean') throw new BadRequestException('Tamamlanma değeri doğru/yanlış olmalı.');
    return atomic(this.prisma, organizationId, async tx => {
      const order = await tx.serviceOrder.findFirst({ where: { id, ...this.buildAccessWhere(organizationId, actorRole, actorId, actorBranchId) }, include: { quotes: true } });
      if (!order) throw new NotFoundException('İş emri bulunamadı.');
      assertOpen(order.status);
      if (!['IN_PROGRESS','PART_WAITING','QUALITY_CONTROL'].includes(order.status)) throw new BadRequestException('İşlem önce onaylanıp başlatılmalı.');
      const item = await tx.serviceOrderItem.findFirst({ where: { id: itemId, serviceOrderId: id } });
      if (!item) throw new NotFoundException('İşlem bulunamadı.');
      if (order.quotes.length && !(await itemApproved(tx, organizationId, item))) throw new BadRequestException('Bu ek işlem için müşteri onayı gerekli.');
      if (item.completed === completed) return item;
      if (completed) await issueItem(tx, organizationId, order.branchId, item, actorId);
      const updated = await tx.serviceOrderItem.update({ where: { id: itemId }, data: { completed }, include: { part: true } });
      await tx.serviceOrderWorkLog.create({ data: { organizationId, serviceOrderId: id, userId: actorId,
        type: ServiceOrderWorkLogType.NOTE, note: `${completed ? 'Tamamlandı' : 'Tamamlanma geri alındı'}: ${item.name}` } });
      const remaining = await tx.serviceOrderItem.count({ where: { serviceOrderId: id, completed: false } });
      if (!remaining && completed) {
        await tx.serviceOrder.update({ where: { id }, data: { status: ServiceOrderStatus.QUALITY_CONTROL } });
        await notifyOffice(tx, organizationId, order.branchId, id, 'Teknik işlemler tamamlandı', `${order.orderNumber} kalite kontrol bekliyor.`);
      } else if (!completed && order.status === ServiceOrderStatus.QUALITY_CONTROL) {
        await tx.serviceOrder.update({ where: { id }, data: { status: ServiceOrderStatus.IN_PROGRESS } });
      }
      return updated;
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

    return atomic(this.prisma, organizationId, async (tx) => {
        const freshOrder = await tx.serviceOrder.findUniqueOrThrow({ where: { id } });
        assertOpen(freshOrder.status);
        const freshItem = await tx.serviceOrderItem.findUniqueOrThrow({ where: { id: itemId } });
        if (freshItem.approvedQuoteId || freshItem.completed) throw new BadRequestException('Onaylanmış veya tamamlanmış işlem silinemez.');
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

  async linkMaintenancePlans(organizationId: string, id: string, role: UserRole, userId: string, branchId: string | null, ids: string[]) {
    return atomic(this.prisma, organizationId, async tx => {
      const order = await tx.serviceOrder.findFirst({ where: { id, ...this.buildAccessWhere(organizationId, role, userId, branchId) } });
      if (!order) throw new NotFoundException('İş emri bulunamadı.');
      assertOpen(order.status);
      const count = await tx.maintenancePlan.count({ where: { id: { in: ids }, organizationId, vehicleId: order.vehicleId, status: 'ACTIVE' } });
      if (count !== ids.length) throw new BadRequestException('Seçilen planlar aracın aktif bakımları olmalı.');
      return tx.serviceOrder.update({ where: { id }, data: { maintenancePlanIds: ids } });
    });
  }

  updateStatus(organizationId: string, id: string, status: ServiceOrderStatus, actorRole: UserRole,
    actorId: string, actorBranchId: string | null, creditDeliveryReason?: string) {
    return atomic(this.prisma, organizationId, async tx => {
      const order = await tx.serviceOrder.findFirst({ where: { id, ...this.buildAccessWhere(organizationId, actorRole, actorId, actorBranchId) }, include: { items: true, quotes: true, vehicle: true } });
      if (!order) throw new NotFoundException('İş emri bulunamadı.');
      if (order.status === status) return order;
      if (actorRole === UserRole.TECHNICIAN && !TECHNICIAN_ALLOWED_STATUSES.has(status)) throw new ForbiddenException('Bu aşama için ofis yetkisi gerekli.');
      assertTransition(order.status, status);
      if (status === ServiceOrderStatus.APPROVED && order.quotes.length) throw new BadRequestException('Onayı teklif üzerinden verin.');
      if (['QUALITY_CONTROL','READY','DELIVERED','PAYMENT_WAITING'].includes(status) && (!order.items.length || order.items.some(i => !i.completed)))
        throw new BadRequestException('Bütün zorunlu işlemleri tamamlayın.');
      if (status === ServiceOrderStatus.CANCELLED && (order.items.some(i => i.stockIssued || i.completed) || order.quotes.some(q => q.status === 'APPROVED')))
        throw new BadRequestException('Onaylı veya uygulanmış iş doğrudan iptal edilemez. İade ve mutabakat işlemi gerekli.');
      if (status === ServiceOrderStatus.DELIVERED && await orderBalance(tx, organizationId, id) > 0) {
        if (![UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTING].includes(actorRole as any) || (typeof creditDeliveryReason !== 'string' || creditDeliveryReason.trim().length < 5))
          throw new BadRequestException('Bakiye var. Tahsilatı tamamlayın veya yetkili hesapla gerekçeli cari teslim yapın.');
      }
      const deliveredAt = status === ServiceOrderStatus.DELIVERED ? new Date() : undefined;
      const updated = await tx.serviceOrder.update({ where: { id }, data: { status, deliveredAt,
        creditDeliveryReason: deliveredAt ? typeof creditDeliveryReason === 'string' ? creditDeliveryReason.trim() || null : null : undefined }, include: { items: true, vehicle: true } });
      if (deliveredAt) {
        for (const planId of order.maintenancePlanIds) await finishPlan(tx, organizationId, planId, order.mileage, deliveredAt);
        await tx.vehicle.updateMany({
          where: { id: order.vehicleId, mileage: { lte: order.mileage } },
          data: { mileage: order.mileage, mileageUpdatedAt: deliveredAt },
        });
        await tx.maintenanceRecord.upsert({ where: { serviceOrderId: id }, update: {}, create: {
          organizationId, branchId: order.branchId, vehicleId: order.vehicleId, serviceOrderId: id,
          mileage: order.mileage, performedAt: deliveredAt, notes: order.complaint,
          totalAmount: order.items.reduce((sum, i) => sum + itemTotal(i), 0),
          items: { create: order.items.filter(i => i.completed).map(i => ({ partId: i.partId, name: i.name,
            description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice })) },
        } });
      }
      await notifyOffice(tx, organizationId, order.branchId, id,
        status === 'PART_WAITING' ? 'Parça talebi bekleniyor' : status === 'READY' ? 'Araç teslimata hazır' : 'Servis aşaması güncellendi',
        `${order.orderNumber}: ${status}`, status === 'PART_WAITING');
      const customer = await tx.customer.findUnique({ where: { id: order.customerId }, select: { portalEnabled: true } });
      if (customer?.portalEnabled) await tx.notification.create({ data: { organizationId, branchId: order.branchId,
        customerId: order.customerId, serviceOrderId: id, channel: NotificationChannel.IN_APP, status: NotificationStatus.PENDING,
        title: status === 'DELIVERED' ? 'Araç teslim edildi' : status === 'READY' ? 'Aracınız teslimata hazır' : 'Servis durumu güncellendi',
        message: `${order.vehicle.plate} plakalı aracınızın servis aşaması güncellendi. Uygulamadan takip edebilirsiniz.` } });
      return updated;
    });
  }
}
