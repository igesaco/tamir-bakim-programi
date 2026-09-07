import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
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

  create(
    organizationId: string,
    branchId: string | null,
    role: UserRole,
    dto: CreateCustomerDto,
  ) {
    if (
      role ===
        UserRole.SERVICE_ADVISOR &&
      !branchId
    ) {
      throw new BadRequestException(
        'Servis danışmanı için şube ataması gerekli.',
      );
    }

    return this.prisma.customer.create({
      data: {
        ...dto,
        organizationId,
        branchId,
      },
    });
  }

  findAll(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
  ) {
    return this.prisma.customer.findMany({
      where: this.accessWhere(
        organizationId,
        role,
        branchId,
      ),
      include: {
        vehicles: true,
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
    branchId: string | null,
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id,
          ...this.accessWhere(
            organizationId,
            role,
            branchId,
          ),
        },
        include: {
          vehicles: true,
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Müşteri bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return customer;
  }

  async update(
    organizationId: string,
    id: string,
    role: UserRole,
    branchId: string | null,
    dto: UpdateCustomerDto,
  ) {
    await this.findOne(
      organizationId,
      id,
      role,
      branchId,
    );

    return this.prisma.customer.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        notes: dto.notes,
      },
      include: {
        vehicles: true,
      },
    });
  }

  async remove(
    organizationId: string,
    id: string,
    role: UserRole,
    branchId: string | null,
  ) {
    await this.findOne(
      organizationId,
      id,
      role,
      branchId,
    );

    const [
      vehicleCount,
      appointmentCount,
      serviceOrderCount,
      quoteCount,
      paymentCount,
    ] = await Promise.all([
      this.prisma.vehicle.count({
        where: { customerId: id },
      }),
      this.prisma.appointment.count({
        where: { customerId: id },
      }),
      this.prisma.serviceOrder.count({
        where: { customerId: id },
      }),
      this.prisma.quote.count({
        where: { customerId: id },
      }),
      this.prisma.payment.count({
        where: { customerId: id },
      }),
    ]);

    const dependencyCount =
      vehicleCount +
      appointmentCount +
      serviceOrderCount +
      quoteCount +
      paymentCount;

    if (dependencyCount > 0) {
      throw new BadRequestException(
        'Bu müşteriye bağlı araç veya servis kayıtları bulunduğu için müşteri silinemez.',
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Müşteri silindi.',
    };
  }
}
