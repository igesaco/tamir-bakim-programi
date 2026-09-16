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
      delayedOrders,
      unassignedOrders,
      partWaitingOrders,
      pendingQuotes,
      activeWorkSessions,
      openProcurementRequests,
      warrantyReturns,
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
      this.prisma.serviceOrder.count({
        where: {
          organizationId,
          estimatedDeliveryAt: { lt: new Date() },
          status: { notIn: [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.CANCELLED] },
        },
      }),
      this.prisma.serviceOrder.count({
        where: {
          organizationId,
          assignedTechnicianId: null,
          status: { notIn: [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.CANCELLED] },
        },
      }),
      this.prisma.serviceOrder.count({
        where: { organizationId, status: ServiceOrderStatus.PART_WAITING },
      }),
      this.prisma.quote.count({
        where: { organizationId, status: 'SENT' },
      }),
      this.prisma.serviceOrderWorkSession.count({
        where: { organizationId, status: 'ACTIVE' },
      }),
      this.prisma.procurementRequest.count({
        where: { organizationId, status: { in: ['OPEN', 'ORDERED'] } },
      }),
      this.prisma.serviceOrderItem.count({
        where: { warrantyClaimOfId: { not: null }, serviceOrder: { organizationId } },
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
      delayedOrders,
      unassignedOrders,
      partWaitingOrders,
      pendingQuotes,
      activeWorkSessions,
      openProcurementRequests,
      warrantyReturns,
    };
  }
}
