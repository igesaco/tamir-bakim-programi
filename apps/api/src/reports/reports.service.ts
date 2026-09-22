import { Injectable } from '@nestjs/common';
import {
  PaymentMethod,
  PaymentStatus,
  ServiceOrderStatus,
  UserRole,
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

  async revenue(organizationId: string, months: number = 12) {
    const safeMonths = Math.min(24, Math.max(1, Number(months) || 12));
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - safeMonths + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const [payments, orders] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          organizationId,
          status: PaymentStatus.PAID,
          paidAt: { gte: startDate },
        },
        select: {
          amount: true,
          method: true,
          paidAt: true,
          createdAt: true,
        },
      }),
      this.prisma.serviceOrder.findMany({
        where: {
          organizationId,
          status: { in: [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.READY] },
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          deliveredAt: true,
        },
      }),
    ]);

    const monthMap = new Map<
      string,
      {
        key: string;
        label: string;
        revenue: number;
        ordersCount: number;
        cash: number;
        card: number;
        transfer: number;
      }
    >();

    const monthNames = [
      'Oca',
      'Şub',
      'Mar',
      'Nis',
      'May',
      'Haz',
      'Tem',
      'Ağu',
      'Eyl',
      'Eki',
      'Kas',
      'Ara',
    ];

    for (let i = 0; i < safeMonths; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = `${monthNames[d.getMonth()]} '${String(y).slice(2)}`;
      monthMap.set(key, {
        key,
        label,
        revenue: 0,
        ordersCount: 0,
        cash: 0,
        card: 0,
        transfer: 0,
      });
    }

    for (const p of payments) {
      const d = new Date(p.paidAt || p.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const slot = monthMap.get(key);
      if (slot) {
        const amt = Number(p.amount);
        slot.revenue = Math.round((slot.revenue + amt) * 100) / 100;
        if (p.method === PaymentMethod.CASH)
          slot.cash = Math.round((slot.cash + amt) * 100) / 100;
        else if (p.method === PaymentMethod.CARD)
          slot.card = Math.round((slot.card + amt) * 100) / 100;
        else if (p.method === PaymentMethod.TRANSFER)
          slot.transfer = Math.round((slot.transfer + amt) * 100) / 100;
      }
    }

    for (const o of orders) {
      const d = new Date(o.deliveredAt || o.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const slot = monthMap.get(key);
      if (slot) {
        slot.ordersCount += 1;
      }
    }

    return Array.from(monthMap.values());
  }

  async technicianPerformance(organizationId: string) {
    const technicians = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: [UserRole.TECHNICIAN, UserRole.MANAGER, UserRole.OWNER] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedServiceOrders: {
          where: { organizationId },
          select: {
            id: true,
            status: true,
          },
        },
        workSessions: {
          where: { organizationId },
          select: {
            id: true,
            status: true,
            durationMinutes: true,
          },
        },
      },
    });

    return technicians
      .map((tech) => {
        const assignedOrders = tech.assignedServiceOrders.length;
        const completedOrders = tech.assignedServiceOrders.filter(
          (o) =>
            o.status === ServiceOrderStatus.DELIVERED ||
            o.status === ServiceOrderStatus.READY,
        ).length;
        const totalWorkMinutes = tech.workSessions.reduce(
          (sum, ws) => sum + (ws.durationMinutes || 0),
          0,
        );
        const activeSessions = tech.workSessions.filter(
          (ws) => ws.status === 'ACTIVE',
        ).length;

        return {
          id: tech.id,
          name: `${tech.firstName} ${tech.lastName}`.trim(),
          role: tech.role,
          assignedOrders,
          completedOrders,
          totalWorkHours: Math.round((totalWorkMinutes / 60) * 10) / 10,
          activeSessions,
          completionRate:
            assignedOrders > 0
              ? Math.round((completedOrders / assignedOrders) * 100)
              : 0,
        };
      })
      .filter(
        (t) =>
          t.assignedOrders > 0 ||
          t.totalWorkHours > 0 ||
          t.role === UserRole.TECHNICIAN,
      )
      .sort(
        (a, b) =>
          b.completedOrders - a.completedOrders ||
          b.totalWorkHours - a.totalWorkHours,
      );
  }

  async popularServices(organizationId: string, limit = 10) {
    const items = await this.prisma.serviceOrderItem.findMany({
      where: {
        serviceOrder: { organizationId },
      },
      select: {
        name: true,
        type: true,
        quantity: true,
        totalPrice: true,
        grossTotal: true,
      },
    });

    const itemMap = new Map<
      string,
      { name: string; type: string; count: number; totalRevenue: number }
    >();

    for (const item of items) {
      const name = item.name.trim();
      const existing = itemMap.get(name) || {
        name,
        type: item.type,
        count: 0,
        totalRevenue: 0,
      };

      existing.count += Number(item.quantity || 1);
      existing.totalRevenue += Number(item.grossTotal || item.totalPrice || 0);
      itemMap.set(name, existing);
    }

    return Array.from(itemMap.values())
      .map((i) => ({
        ...i,
        totalRevenue: Math.round(i.totalRevenue * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Math.min(50, Math.max(1, limit)));
  }

  async vehicleStats(organizationId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { organizationId },
      select: {
        brand: true,
        model: true,
        year: true,
        mileage: true,
      },
    });

    const totalVehicles = vehicles.length;
    const brandMap = new Map<string, number>();
    let totalMileage = 0;
    let mileageCount = 0;

    for (const v of vehicles) {
      const b = (v.brand || 'Bilinmeyen').toUpperCase().trim();
      brandMap.set(b, (brandMap.get(b) || 0) + 1);
      if (v.mileage && v.mileage > 0) {
        totalMileage += v.mileage;
        mileageCount += 1;
      }
    }

    const topBrands = Array.from(brandMap.entries())
      .map(([brand, count]) => ({
        brand,
        count,
        percentage:
          totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      totalVehicles,
      averageMileage:
        mileageCount > 0 ? Math.round(totalMileage / mileageCount) : 0,
      topBrands,
    };
  }

  async paymentMethods(organizationId: string, from?: string, to?: string) {
    const where: any = {
      organizationId,
      status: PaymentStatus.PAID,
    };

    if (from || to) {
      where.paidAt = {};
      if (from) where.paidAt.gte = new Date(from);
      if (to) {
        const toD = new Date(to);
        if (to.length === 10) toD.setHours(23, 59, 59, 999);
        where.paidAt.lte = toD;
      }
    }

    const payments = await this.prisma.payment.findMany({
      where,
      select: {
        amount: true,
        method: true,
      },
    });

    const methodLabels: Record<string, string> = {
      CASH: 'Nakit',
      CARD: 'Banka / Kredi Kartı',
      TRANSFER: 'Havale / EFT',
      OTHER: 'Diğer',
    };

    const methodTotals: Record<string, { amount: number; count: number }> = {
      CASH: { amount: 0, count: 0 },
      CARD: { amount: 0, count: 0 },
      TRANSFER: { amount: 0, count: 0 },
      OTHER: { amount: 0, count: 0 },
    };

    let grandTotal = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      grandTotal += amt;
      const m = p.method in methodTotals ? p.method : 'OTHER';
      methodTotals[m].amount += amt;
      methodTotals[m].count += 1;
    }

    const methods = Object.entries(methodTotals).map(([method, data]) => ({
      method,
      label: methodLabels[method] || method,
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
      percentage:
        grandTotal > 0 ? Math.round((data.amount / grandTotal) * 100) : 0,
    }));

    return {
      total: Math.round(grandTotal * 100) / 100,
      totalCount: payments.length,
      methods,
    };
  }
}
