import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  ServiceItemType,
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

  async stockOut(
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

    const inventory =
      await this.prisma.inventory.findUnique({
        where: {
          branchId_partId: {
            branchId:
              validBranchId,
            partId:
              dto.partId,
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
        organizationId
    ) {
      throw new NotFoundException(
        'Bu parça stokta bulunamadı.',
      );
    }

    if (
      Number(
        inventory.quantity,
      ) < dto.quantity
    ) {
      throw new BadRequestException(
        'Yeterli stok bulunmuyor.',
      );
    }

    if (dto.serviceOrderId) {
      const order =
        await this.prisma.serviceOrder.findFirst({
          where: {
            id:
              dto.serviceOrderId,
            organizationId,
            branchId:
              validBranchId,
          },
        });

      if (!order) {
        throw new BadRequestException(
          'İş emri bulunamadı.',
        );
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const updatedInventory =
          await tx.inventory.update({
            where: {
              branchId_partId: {
                branchId:
                  validBranchId,
                partId:
                  dto.partId,
              },
            },
            data: {
              quantity: {
                decrement:
                  dto.quantity,
              },
            },
            include: {
              part: true,
            },
          });

        let serviceOrderItemId:
          | string
          | null = null;

        if (dto.serviceOrderId) {
          const total =
            dto.quantity *
            Number(
              inventory.part
                .salePrice,
            );

          const serviceOrderItem =
            await tx.serviceOrderItem.create({
              data: {
                serviceOrderId:
                  dto.serviceOrderId,
                partId:
                  dto.partId,
                type:
                  ServiceItemType.PART,
                name:
                  inventory.part.name,
                description:
                  dto.note,
                quantity:
                  dto.quantity,
                unitPrice:
                  inventory.part
                    .salePrice,
                totalPrice:
                  total,
              },
            });

          serviceOrderItemId =
            serviceOrderItem.id;
        }

        await tx.inventoryMovement.create({
          data: {
            organizationId,
            branchId:
              validBranchId,
            partId:
              dto.partId,
            serviceOrderId:
              dto.serviceOrderId,
            createdById:
              userId,
            type:
              InventoryMovementType.OUT,
            quantity:
              dto.quantity,
            unitCost:
              dto.unitCost ??
              inventory.part
                .purchasePrice,
            note:
              serviceOrderItemId
                ? `SERVICE_ORDER_ITEM:${serviceOrderItemId}`
                : dto.note,
          },
        });

        return updatedInventory;
      },
    );
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
