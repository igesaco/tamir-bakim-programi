import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InspectionStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { CreateInspectionItemDto } from './dto/create-inspection-item.dto';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private branchFilter(
    role: UserRole,
    branchId: string | null,
  ) {
    if (
      role === UserRole.SERVICE_ADVISOR
    ) {
      return {
        branchId:
          branchId ??
          '__branch_not_assigned__',
      };
    }

    return {};
  }

  async create(
    organizationId: string,
    actorBranchId: string | null,
    actorRole: UserRole,
    userId: string,
    dto: CreateInspectionDto,
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

    let branchId = actorBranchId;

    if (dto.serviceOrderId) {
      const serviceOrder =
        await this.prisma.serviceOrder.findFirst({
          where: {
            id: dto.serviceOrderId,
            organizationId,
            vehicleId: dto.vehicleId,
            ...this.branchFilter(
              actorRole,
              actorBranchId,
            ),
          },
        });

      if (!serviceOrder) {
        throw new BadRequestException(
          'İş emri geçersiz veya bu iş emrine erişim yetkiniz yok.',
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
        'Geçerli ve aktif bir şube gerekli.',
      );
    }

    return this.prisma.inspection.create({
      data: {
        organizationId,
        branchId,
        vehicleId: dto.vehicleId,
        serviceOrderId:
          dto.serviceOrderId,
        inspectorId: userId,
        mileage: dto.mileage,
        fuelLevel:
          dto.fuelLevel,
        customerComplaint:
          dto.customerComplaint,
        existingDamage:
          dto.existingDamage,
        valuablesNote:
          dto.valuablesNote,
      },
      include: {
        vehicle: true,
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
        media: true,
      },
    });
  }

  findAll(
    organizationId: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    return this.prisma.inspection.findMany({
      where: {
        organizationId,
        ...this.branchFilter(
          actorRole,
          actorBranchId,
        ),
      },
      include: {
        vehicle: true,
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
        media: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addItem(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorBranchId: string | null,
    dto: CreateInspectionItemDto,
  ) {
    const inspection =
      await this.prisma.inspection.findFirst({
        where: {
          id,
          organizationId,
          ...this.branchFilter(
            actorRole,
            actorBranchId,
          ),
        },
      });

    if (!inspection) {
      throw new NotFoundException(
        'Kontrol kaydı bulunamadı veya erişim yetkiniz yok.',
      );
    }

    if (
      inspection.status ===
      InspectionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Tamamlanmış araç kabul kaydına yeni kontrol maddesi eklenemez.',
      );
    }

    return this.prisma.inspectionItem.create({
      data: {
        inspectionId: id,
        category: dto.category,
        name: dto.name,
        condition:
          dto.condition,
        note: dto.note,
        recommendedAction:
          dto.recommendedAction,
      },
    });
  }

  async complete(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    const inspection =
      await this.prisma.inspection.findFirst({
        where: {
          id,
          organizationId,
          ...this.branchFilter(
            actorRole,
            actorBranchId,
          ),
        },
      });

    if (!inspection) {
      throw new NotFoundException(
        'Kontrol kaydı bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return this.prisma.inspection.update({
      where: { id },
      data: {
        status:
          InspectionStatus.COMPLETED,
      },
      include: {
        items: true,
        media: true,
      },
    });
  }
}
