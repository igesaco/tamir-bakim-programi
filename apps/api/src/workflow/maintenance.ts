import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export async function finishPlan(tx: Prisma.TransactionClient, organizationId: string, id: string, mileage: number, performedAt: Date) {
  const plan = await tx.maintenancePlan.findFirst({ where: { id, organizationId }, include: { vehicle: true } });
  if (!plan) throw new BadRequestException('Bakım planı bulunamadı.');
  if (plan.status === 'COMPLETED') return { completedPlan: plan, nextPlan: null };
  if (plan.status !== 'ACTIVE') throw new BadRequestException('Bakım planı aktif değil.');
  if (mileage < (plan.lastKm || 0) || performedAt > new Date() || (plan.lastDate && performedAt < plan.lastDate))
    throw new BadRequestException('Gerçekleşen bakım tarihi veya kilometresi geçersiz.');
  const completedPlan = await tx.maintenancePlan.update({ where: { id }, data: { status: 'COMPLETED', lastKm: mileage, lastDate: performedAt } });
  let nextPlan = null;
  if (plan.intervalKm || plan.intervalMonths) {
    let nextDueDate: Date | null = null;
    if (plan.intervalMonths) { nextDueDate = new Date(performedAt); nextDueDate.setMonth(nextDueDate.getMonth() + plan.intervalMonths); }
    nextPlan = await tx.maintenancePlan.create({ data: { organizationId, branchId: plan.branchId || plan.vehicle.branchId,
      vehicleId: plan.vehicleId, title: plan.title, category: plan.category, description: plan.description,
      intervalKm: plan.intervalKm, intervalMonths: plan.intervalMonths, lastKm: mileage, lastDate: performedAt,
      nextDueKm: plan.intervalKm ? mileage + plan.intervalKm : null, nextDueDate,
      estimatedPriceMin: plan.estimatedPriceMin, estimatedPriceMax: plan.estimatedPriceMax } });
  }
  return { completedPlan, nextPlan };
}
