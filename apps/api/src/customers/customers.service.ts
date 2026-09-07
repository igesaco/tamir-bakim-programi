import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  create(
    organizationId: string,
    branchId: string | null,
    dto: CreateCustomerDto,
  ) {
    return this.prisma.customer.create({
      data: {
        ...dto,
        organizationId,
        branchId,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.customer.findMany({
      where: {
        organizationId,
      },
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
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          vehicles: true,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Müşteri bulunamadı.',
      );
    }

    return customer;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateCustomerDto,
  ) {
    await this.findOne(
      organizationId,
      id,
    );

    return this.prisma.customer.update({
      where: {
        id,
      },
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
  ) {
    await this.findOne(
      organizationId,
      id,
    );

    const [
      vehicleCount,
      appointmentCount,
      serviceOrderCount,
      quoteCount,
      paymentCount,
    ] = await Promise.all([
      this.prisma.vehicle.count({
        where: {
          customerId: id,
        },
      }),

      this.prisma.appointment.count({
        where: {
          customerId: id,
        },
      }),

      this.prisma.serviceOrder.count({
        where: {
          customerId: id,
        },
      }),

      this.prisma.quote.count({
        where: {
          customerId: id,
        },
      }),

      this.prisma.payment.count({
        where: {
          customerId: id,
        },
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
      where: {
        id,
      },
    });

    return {
      success: true,
      message: 'Müşteri silindi.',
    };
  }
}
