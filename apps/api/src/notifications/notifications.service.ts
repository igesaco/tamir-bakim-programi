import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private accessWhere(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
    userId?: string,
  ) {
    if (
      role === UserRole.TECHNICIAN ||
      role === UserRole.WAREHOUSE ||
      role === UserRole.ACCOUNTING
    ) {
      return {
        organizationId,
        userId:
          userId ??
          '__user_not_assigned__',
      };
    }

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

  async create(
    organizationId: string,
    branchId: string | null,
    role: UserRole,
    dto: CreateNotificationDto,
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

    if (dto.customerId) {
      const customer =
        await this.prisma.customer.findFirst({
          where: {
            id: dto.customerId,
            organizationId,
            ...(role ===
            UserRole.SERVICE_ADVISOR
              ? {
                  branchId:
                    branchId ??
                    '__branch_not_assigned__',
                }
              : {}),
          },
        });

      if (!customer) {
        throw new BadRequestException(
          'Müşteri bulunamadı veya erişim yetkiniz yok.',
        );
      }
    }

    if (dto.userId) {
      const user =
        await this.prisma.user.findFirst({
          where: {
            id: dto.userId,
            organizationId,
          },
        });

      if (!user) {
        throw new BadRequestException(
          'Kullanıcı bulunamadı.',
        );
      }
    }

    if (dto.appointmentId) {
      const appointment =
        await this.prisma.appointment.findFirst({
          where: {
            id: dto.appointmentId,
            organizationId,
            ...(role ===
            UserRole.SERVICE_ADVISOR
              ? {
                  branchId:
                    branchId ??
                    '__branch_not_assigned__',
                }
              : {}),
          },
        });

      if (!appointment) {
        throw new BadRequestException(
          'Randevu bulunamadı veya erişim yetkiniz yok.',
        );
      }
    }

    if (dto.serviceOrderId) {
      const order =
        await this.prisma.serviceOrder.findFirst({
          where: {
            id: dto.serviceOrderId,
            organizationId,
            ...(role ===
            UserRole.SERVICE_ADVISOR
              ? {
                  branchId:
                    branchId ??
                    '__branch_not_assigned__',
                }
              : {}),
          },
        });

      if (!order) {
        throw new BadRequestException(
          'İş emri bulunamadı veya erişim yetkiniz yok.',
        );
      }
    }

    return this.prisma.notification.create({
      data: {
        organizationId,
        branchId,
        customerId:
          dto.customerId,
        userId:
          dto.userId,
        appointmentId:
          dto.appointmentId,
        serviceOrderId:
          dto.serviceOrderId,
        channel:
          dto.channel,
        title:
          dto.title,
        message:
          dto.message,
      },
    });
  }

  findAll(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
    userId?: string,
  ) {
    return this.prisma.notification.findMany({
      where: this.accessWhere(
        organizationId,
        role,
        branchId,
        userId,
      ),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markRead(
    organizationId: string,
    id: string,
    role: UserRole,
    branchId: string | null,
    userId?: string,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          ...this.accessWhere(
            organizationId,
            role,
            branchId,
            userId,
          ),
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Bildirim bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        status:
          NotificationStatus.READ,
        readAt:
          new Date(),
      },
    });
  }
}
