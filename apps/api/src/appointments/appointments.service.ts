import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private accessWhere(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
  ) {
    return {
      organizationId,
      ...(role ===
      UserRole.SERVICE_ADVISOR
        ? {
            branchId:
              branchId ??
              '__branch_not_assigned__',
          }
        : {}),
    };
  }

  async create(
    organizationId: string,
    branchId: string | null,
    role: UserRole,
    userId: string,
    dto: CreateAppointmentDto,
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
          customerId: dto.customerId,
          ...(role ===
          UserRole.SERVICE_ADVISOR
            ? { branchId }
            : {}),
        },
      });

    if (!vehicle) {
      throw new BadRequestException(
        'Müşteri veya araç bilgisi geçersiz ya da erişim yetkiniz yok.',
      );
    }

    return this.prisma.appointment.create({
      data: {
        organizationId,
        branchId,
        customerId:
          dto.customerId,
        vehicleId:
          dto.vehicleId,
        createdById:
          userId,
        startAt:
          new Date(dto.startAt),
        endAt:
          dto.endAt
            ? new Date(
                dto.endAt,
              )
            : null,
        serviceType:
          dto.serviceType,
        customerNote:
          dto.customerNote,
      },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
      },
    });
  }

  findAll(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
  ) {
    return this.prisma.appointment.findMany({
      where: this.accessWhere(
        organizationId,
        role,
        branchId,
      ),
      include: {
        customer: true,
        vehicle: true,
        branch: true,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  async updateStatus(
    organizationId: string,
    id: string,
    status: AppointmentStatus,
    role: UserRole,
    branchId: string | null,
  ) {
    const appointment =
      await this.prisma.appointment.findFirst({
        where: {
          id,
          ...this.accessWhere(
            organizationId,
            role,
            branchId,
          ),
        },
      });

    if (!appointment) {
      throw new NotFoundException(
        'Randevu bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
      },
    });
  }
}
