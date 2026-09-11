import { itemApproved } from '../workflow/item-approval';
import { atomic } from '../workflow/transaction';
import { issueItem } from '../workflow/stock';
import { assertOpen } from '../workflow/order-rules';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { StockMovementDto } from './dto/stock-movement.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async validateBranch(
    organizationId: string,
    branchId: string | null,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Şube seçimi gerekli.',
      );
    }

    const branch =
      await this.prisma.branch.findFirst({
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

  async createPart(
    organizationId: string,
    dto: CreatePartDto,
  ) {
    if (dto.supplierId) {
      const supplier =
        await this.prisma.supplier.findFirst({
          where: {
            id: dto.supplierId,
            organizationId,
          },
        });

      if (!supplier) {
        throw new BadRequestException(
          'Tedarikçi bulunamadı.',
        );
      }
    }

    try {
      return await this.prisma.part.create({
        data: {
          organizationId,
          supplierId:
            dto.supplierId,
          name:
            dto.name.trim(),
          sku:
            dto.sku?.trim(),
          oemCode:
            dto.oemCode?.trim(),
          barcode:
            dto.barcode?.trim(),
          brand:
            dto.brand?.trim(),
          unit:
            dto.unit?.trim() ??
            'ADET',
          purchasePrice:
            dto.purchasePrice,
          salePrice:
            dto.salePrice,
          minimumStock:
            dto.minimumStock ??
            0,
        },
        include: {
          supplier: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'Bu SKU veya barkod başka bir parçada kullanılıyor.',
        );
      }

      throw error;
    }
  }

  findParts(organizationId: string) {
    return this.prisma.part.findMany({
      where: {
        organizationId,
        active: true,
      },
      include: {
        supplier: true,
        inventories: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findStock(
    organizationId: string,
    branchId: string | null,
  ) {
    const validBranchId =
      await this.validateBranch(
        organizationId,
        branchId,
      );

    return this.prisma.inventory.findMany({
      where: {
        organizationId,
        branchId:
          validBranchId,
      },
      include: {
        part: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: {
        part: {
          name: 'asc',
        },
      },
    });
  }

  async findLowStock(
    organizationId: string,
    branchId: string | null,
  ) {
    const validBranchId =
      await this.validateBranch(
        organizationId,
        branchId,
      );

    const inventories =
      await this.prisma.inventory.findMany({
        where: {
          organizationId,
          branchId:
            validBranchId,
        },
        include: {
          part: true,
        },
      });

    return inventories.filter(
      (item) => {
        const quantity =
          Number(
            item.quantity,
          );
        const limit =
          Math.max(
            Number(
              item.minQuantity,
            ),
            Number(
              item.part.minimumStock,
            ),
          );

        return quantity <= limit;
      },
    );
  }

  async stockIn(
    organizationId: string,
    branchId: string | null,
    userId: string,
    dto: StockMovementDto,
  ) {
    const validBranchId =
      await this.validateBranch(
        organizationId,
        branchId,
      );

    const part =
      await this.prisma.part.findFirst({
        where: {
          id: dto.partId,
          organizationId,
          active: true,
        },
      });

    if (!part) {
      throw new NotFoundException(
        'Parça bulunamadı.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const inventory =
          await tx.inventory.upsert({
            where: {
              branchId_partId: {
                branchId:
                  validBranchId,
                partId:
                  dto.partId,
              },
            },
            create: {
              organizationId,
              branchId:
                validBranchId,
              partId:
                dto.partId,
              quantity:
                dto.quantity,
              minQuantity:
                part.minimumStock,
            },
            update: {
              quantity: {
                increment:
                  dto.quantity,
              },
            },
            include: {
              part: true,
            },
          });

        await tx.inventoryMovement.create({
          data: {
            organizationId,
            branchId:
              validBranchId,
            partId:
              dto.partId,
            createdById:
              userId,
            type:
              InventoryMovementType.IN,
            quantity:
              dto.quantity,
            unitCost:
              dto.unitCost,
            note:
              dto.note,
          },
        });

        return inventory;
      },
    );
  }

  async stockOut(organizationId: string, branchId: string | null, userId: string, dto: StockMovementDto) {
    const validBranchId = await this.validateBranch(organizationId, branchId);
    return atomic(this.prisma, organizationId, async tx => {
      if (dto.serviceOrderId) {
        const order = await tx.serviceOrder.findFirst({ where: { id: dto.serviceOrderId, organizationId, branchId: validBranchId }, include: { items: true, quotes: true } });
        if (!order) throw new BadRequestException('İş emri bulunamadı.');
        assertOpen(order.status);
        if (!['APPROVED','IN_PROGRESS','PART_WAITING','QUALITY_CONTROL'].includes(order.status)) throw new BadRequestException('Stok çıkışı için iş emri onaylanmalı.');
        const matches = order.items.filter(item => item.partId === dto.partId && Number(item.quantity) === Number(dto.quantity)
          && (!dto.serviceOrderItemId || item.id === dto.serviceOrderItemId));
        if (matches.length !== 1) throw new BadRequestException('İş emrindeki parça kalemini ve miktarını seçin; yeni parçayı önce teklif/onay sürecine ekleyin.');
        const item = matches[0];
        if (order.quotes.length && !(await itemApproved(tx, organizationId, item))) throw new BadRequestException('Parçanın müşteri onayı gerekli.');
        await issueItem(tx, organizationId, validBranchId, item, userId);
      } else {
        const changed = await tx.inventory.updateMany({ where: { organizationId, branchId: validBranchId, partId: dto.partId, quantity: { gte: dto.quantity } }, data: { quantity: { decrement: dto.quantity } } });
        if (changed.count !== 1) throw new BadRequestException('Yeterli stok bulunmuyor.');
        await tx.inventoryMovement.create({ data: { organizationId, branchId: validBranchId, partId: dto.partId, createdById: userId,
          type: InventoryMovementType.OUT, quantity: dto.quantity, unitCost: dto.unitCost, note: dto.note } });
      }
      return tx.inventory.findUnique({ where: { branchId_partId: { branchId: validBranchId, partId: dto.partId } }, include: { part: true } });
    });
  }

  async findMovements(
    organizationId: string,
    branchId: string | null,
  ) {
    const validBranchId =
      await this.validateBranch(
        organizationId,
        branchId,
      );

    return this.prisma.inventoryMovement.findMany({
      where: {
        organizationId,
        branchId:
          validBranchId,
      },
      include: {
        part: true,
        serviceOrder: true,
        createdBy: {
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
}
