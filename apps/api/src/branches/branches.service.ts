import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

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
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!branch) {
      throw new NotFoundException(
        'Þube bulunamadý.',
      );
    }

    return this.prisma.branch.update({
      where: { id },
      data: { active },
    });
  }
}
