import { Injectable } from '@nestjs/common';
import {
  PaymentStatus,
  ServiceOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(organizationId: string) {
    const [
      customerCount,
      vehicleCount,
      appointmentCount,
      openOrders,
      activePlans,
      paymentAggregate,
      quoteAggregate,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: { organizationId },
      }),

      this.prisma.vehicle.count({
        where: { organizationId },
      }),

      this.prisma.appointment.count({
        where: { organizationId },
      }),

      this.prisma.serviceOrder.count({
        where: {
          organizationId,
          status: {
            notIn: [
              ServiceOrderStatus.DELIVERED,
              ServiceOrderStatus.CANCELLED,
            ],
          },
        },
      }),

      this.prisma.maintenancePlan.count({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
      }),

      this.prisma.payment.aggregate({
        where: {
          organizationId,
          status: PaymentStatus.PAID,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.quote.aggregate({
        where: {
          organizationId,
          status: 'APPROVED',
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    return {
      customers: customerCount,
      vehicles: vehicleCount,
      appointments: appointmentCount,
      openServiceOrders: openOrders,
      activeMaintenancePlans: activePlans,
      totalPaid: Number(
        paymentAggregate._sum.amount ?? 0,
      ),
      approvedQuotesTotal: Number(
        quoteAggregate._sum.total ?? 0,
      ),
    };
  }
}
