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

    const appointmentBranchId = role === UserRole.SERVICE_ADVISOR
      ? branchId : vehicle.branchId ?? branchId;
    if (!appointmentBranchId) {
      throw new BadRequestException('Araç için aktif bir şube seçimi gerekli.');
    }
    const branch = await this.prisma.branch.findFirst({
      where: { id: appointmentBranchId, organizationId, active: true },
    });
    if (!branch) throw new BadRequestException('Randevu şubesi aktif değil.');

    const startAt = new Date(dto.startAt);
    if (!Number.isFinite(startAt.getTime()) || startAt <= new Date()) {
      throw new BadRequestException('Randevu zamanı gelecekte olmalıdır.');
    }
    const estimatedDurationMinutes = dto.estimatedDurationMinutes ?? 60;
    const endAt = dto.endAt
      ? new Date(dto.endAt)
      : new Date(startAt.getTime() + estimatedDurationMinutes * 60_000);
    if (!Number.isFinite(endAt.getTime()) || endAt <= startAt) {
      throw new BadRequestException('Randevu bitiş zamanı başlangıçtan sonra olmalıdır.');
    }

    if (dto.assignedTechnicianId) {
      const technician = await this.prisma.user.findFirst({
        where: {
          id: dto.assignedTechnicianId,
          organizationId,
          branchId: appointmentBranchId,
          role: UserRole.TECHNICIAN,
          active: true,
        },
      });
      if (!technician) {
        throw new BadRequestException('Seçilen teknisyen bu şubede aktif değil.');
      }
      const conflict = await this.prisma.appointment.findFirst({
        where: {
          organizationId,
          assignedTechnicianId: dto.assignedTechnicianId,
          status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW] },
          startAt: { lt: endAt },
          OR: [
            { endAt: { gt: startAt } },
            { endAt: null, startAt: { gt: new Date(startAt.getTime() - 60 * 60_000) } },
          ],
        },
      });
      if (conflict) {
        throw new BadRequestException('Seçilen teknisyenin bu saat aralığında başka randevusu var.');
      }
    }

    return this.prisma.appointment.create({
      data: {
        organizationId,
        branchId: appointmentBranchId,
        customerId:
          dto.customerId,
        vehicleId:
          dto.vehicleId,
        createdById:
          userId,
        startAt,
        endAt,
        estimatedDurationMinutes,
        assignedTechnicianId: dto.assignedTechnicianId,
        serviceType:
          dto.serviceType,
        customerNote:
          dto.customerNote,
      },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
        assignedTechnician: true,
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
        assignedTechnician: true,
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
        assignedTechnician: true,
      },
    });
  }
}
