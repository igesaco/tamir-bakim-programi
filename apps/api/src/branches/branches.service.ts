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

  create(
    organizationId: string,
    dto: CreateBranchDto,
  ) {
    return this.prisma.branch.create({
      data: {
        organizationId,
        ...dto,
      },
    });
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
