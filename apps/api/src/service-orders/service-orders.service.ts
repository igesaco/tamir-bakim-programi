import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ServiceOrderStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';

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
      actorRole === UserRole.TECHNICIAN &&
      !TECHNICIAN_ALLOWED_STATUSES.has(
        status,
      )
    ) {
      throw new ForbiddenException(
        'Teknisyen bu servis durumunu kullanamaz.',
      );
    }

    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        status,
        deliveredAt:
          status ===
          ServiceOrderStatus.DELIVERED
            ? new Date()
            : undefined,
      },
      include: {
        assignedTechnician: true,
      },
    });
  }
}
