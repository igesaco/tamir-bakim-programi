import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

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
      where: { organizationId },
      include: {
        vehicles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        vehicles: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı.');
    }

    return customer;
  }
}