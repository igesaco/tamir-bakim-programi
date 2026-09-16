import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceOrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateBranchDto,
  ) {
    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Şube adı en az 2 karakter olmalıdır.');
    }

    const existing = await this.prisma.branch.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Bu isimde bir şube zaten bulunuyor.');
    }

    try {
      return await this.prisma.branch.create({
        data: {
          organizationId,
          ...dto,
          name,
          phone: dto.phone?.trim() || null,
          address: dto.address?.trim() || null,
          city: dto.city?.trim() || null,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Bu isimde bir şube zaten bulunuyor.');
      }
      throw error;
    }
  }

  options(organizationId: string, role: string, branchId: string | null) {
    return this.prisma.branch.findMany({
      where: { organizationId, active: true,
        ...(role === 'SERVICE_ADVISOR' ? { id: branchId ?? '__none__' } : {}),
      }, select: { id: true, name: true }, orderBy: { name: 'asc' },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.branch.findMany({
      where: {
        organizationId,
      },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            serviceOrders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async setActive(
    organizationId: string,
    id: string,
    active: boolean,
  ) {
    const branch =
      await this.prisma.branch.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!branch) {
      throw new NotFoundException(
        'Şube bulunamadı.',
      );
    }

    if (!active) {
      const [
        activeUsers,
        openOrders,
      ] = await Promise.all([
        this.prisma.user.count({
          where: {
            organizationId,
            branchId: id,
            active: true,
          },
        }),
        this.prisma.serviceOrder.count({
          where: {
            organizationId,
            branchId: id,
            status: {
              notIn: [
                ServiceOrderStatus.DELIVERED,
                ServiceOrderStatus.CANCELLED,
              ],
            },
          },
        }),
      ]);

      if (
        activeUsers > 0 ||
        openOrders > 0
      ) {
        throw new BadRequestException(
          'Aktif personeli veya açık iş emri bulunan şube pasif yapılamaz.',
        );
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: { active },
    });
  }
}
