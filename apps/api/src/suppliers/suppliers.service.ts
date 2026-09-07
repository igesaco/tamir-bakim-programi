import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        organizationId,
        ...dto,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.supplier.findMany({
      where: { organizationId },
      include: {
        parts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        parts: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Tedarikçi bulunamadý.');
    }

    return supplier;
  }
}
