import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    branchId: string | null,
    userId: string,
    dto: CreateAppointmentDto,
  ) {
    if (!branchId) {
      throw new BadRequestException('Þube seçimi gerekli.');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: dto.vehicleId,
        organizationId,
        customerId: dto.customerId,
      },
    });

    if (!vehicle) {
      throw new BadRequestException('Müþteri veya araç bilgisi geçersiz.');
    }

    return this.prisma.appointment.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        createdById: userId,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        serviceType: dto.serviceType,
        customerNote: dto.customerNote,
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.appointment.findMany({
      where: { organizationId },
      include: {
        customer: true,
        vehicle: true,
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
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, organizationId },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadý.');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }
}
