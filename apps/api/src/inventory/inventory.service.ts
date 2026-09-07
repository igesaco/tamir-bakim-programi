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
  constructor(private readonly prisma: PrismaService) {}

  async createPart(
    organizationId: string,
    dto: CreatePartDto,
  ) {
    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id: dto.supplierId,
          organizationId,
        },
      });

      if (!supplier) {
        throw new BadRequestException(
          'Tedarikçi bulunamadý.',
        );
      }
    }

    return this.prisma.part.create({
      data: {
        organizationId,
        supplierId: dto.supplierId,
        name: dto.name,
        sku: dto.sku,
        oemCode: dto.oemCode,
        barcode: dto.barcode,
        brand: dto.brand,
        unit: dto.unit ?? 'ADET',
        purchasePrice: dto.purchasePrice,
        salePrice: dto.salePrice,
        minimumStock: dto.minimumStock ?? 0,
      },
      include: {
        supplier: true,
      },
    });
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

  findStock(
    organizationId: string,
    branchId: string | null,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Þube seçimi gerekli.',
      );
    }

    return this.prisma.inventory.findMany({
      where: {
        organizationId,
        branchId,
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
    if (!branchId) {
      throw new BadRequestException(
        'Þube seçimi gerekli.',
      );
    }

    const inventories = await this.prisma.inventory.findMany({
      where: {
        organizationId,
        branchId,
      },
      include: {
        part: true,
      },
    });

    return inventories.filter((item) => {
      const quantity = Number(item.quantity);
      const limit = Math.max(
        Number(item.minQuantity),
        Number(item.part.minimumStock),
      );

      return quantity <= limit;
    });
  }

  async stockIn(
    organizationId: string,
    branchId: string | null,
    userId: string,
    dto: StockMovementDto,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Þube seçimi gerekli.',
      );
    }

    const part = await this.prisma.part.findFirst({
      where: {
        id: dto.partId,
        organizationId,
        active: true,
      },
    });

    if (!part) {
      throw new NotFoundException('Parça bulunamadý.');
    }

    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.upsert({
        where: {
          branchId_partId: {
            branchId,
            partId: dto.partId,
          },
        },
        create: {
          organizationId,
          branchId,
          partId: dto.partId,
          quantity: dto.quantity,
          minQuantity: part.minimumStock,
        },
        update: {
          quantity: {
            increment: dto.quantity,
          },
        },
        include: {
          part: true,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          organizationId,
          branchId,
          partId: dto.partId,
          createdById: userId,
          type: InventoryMovementType.IN,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          note: dto.note,
        },
      });

      return inventory;
    });
  }

  async stockOut(
    organizationId: string,
    branchId: string | null,
    userId: string,
    dto: StockMovementDto,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Þube seçimi gerekli.',
      );
    }

    const inventory = await this.prisma.inventory.findUnique({
      where: {
        branchId_partId: {
          branchId,
          partId: dto.partId,
        },
      },
      include: {
        part: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        'Bu parça stokta bulunamadý.',
      );
    }

    if (Number(inventory.quantity) < dto.quantity) {
      throw new BadRequestException(
        'Yeterli stok bulunmuyor.',
      );
    }

    if (dto.serviceOrderId) {
      const order = await this.prisma.serviceOrder.findFirst({
        where: {
          id: dto.serviceOrderId,
          organizationId,
          branchId,
        },
      });

      if (!order) {
        throw new BadRequestException(
          'Ýþ emri bulunamadý.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedInventory = await tx.inventory.update({
        where: {
          branchId_partId: {
            branchId,
            partId: dto.partId,
          },
        },
        data: {
          quantity: {
            decrement: dto.quantity,
          },
        },
        include: {
          part: true,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          organizationId,
          branchId,
          partId: dto.partId,
          serviceOrderId: dto.serviceOrderId,
          createdById: userId,
          type: InventoryMovementType.OUT,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          note: dto.note,
        },
      });

      if (dto.serviceOrderId) {
        const total =
          dto.quantity * Number(inventory.part.salePrice);

        await tx.serviceOrderItem.create({
          data: {
            serviceOrderId: dto.serviceOrderId,
            partId: dto.partId,
            type: ServiceItemType.PART,
            name: inventory.part.name,
            description: dto.note,
            quantity: dto.quantity,
            unitPrice: inventory.part.salePrice,
            totalPrice: total,
          },
        });
      }

      return updatedInventory;
    });
  }

  findMovements(
    organizationId: string,
    branchId: string | null,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Þube seçimi gerekli.',
      );
    }

    return this.prisma.inventoryMovement.findMany({
      where: {
        organizationId,
        branchId,
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
