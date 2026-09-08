import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    organizationId: string;
    branchId?: string | null;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    actorType?: string | null;
    platformUserId?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: data.organizationId,
        branchId: data.branchId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldData: data.oldData,
        newData: data.newData,
        ipAddress: data.ipAddress,
        actorType:
          data.actorType,
        platformUserId:
          data.platformUserId,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 500,
    });
  }
}
