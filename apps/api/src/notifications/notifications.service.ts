import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    organizationId: string,
    branchId: string | null,
    dto: CreateNotificationDto,
  ) {
    return this.prisma.notification.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,
        userId: dto.userId,
        appointmentId: dto.appointmentId,
        serviceOrderId: dto.serviceOrderId,
        channel: dto.channel,
        title: dto.title,
        message: dto.message,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markRead(
    organizationId: string,
    id: string,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Bildirim bulunamadý.',
      );
    }

    return this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }
}
