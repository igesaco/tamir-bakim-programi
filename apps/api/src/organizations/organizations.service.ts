import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: {
          select: {
            users: true,
            customers: true,
            vehicles: true,
            serviceOrders: true,
          },
        },
      },
    });
  }

  updateMine(
    id: string,
    dto: UpdateOrganizationDto,
  ) {
    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }
}
