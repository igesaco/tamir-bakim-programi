import { BadRequestException } from '@nestjs/common';
import { ServiceOrderStatus } from '@prisma/client';

export const transitions: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  APPOINTMENT: ['ARRIVED', 'CANCELLED'], ARRIVED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['INSPECTION', 'QUOTE_WAITING', 'APPROVED', 'CANCELLED'],
  INSPECTION: ['QUOTE_WAITING', 'APPROVED', 'CANCELLED'],
  QUOTE_WAITING: ['APPROVED', 'CANCELLED'], APPROVED: ['IN_PROGRESS'],
  IN_PROGRESS: ['PART_WAITING', 'QUALITY_CONTROL'], PART_WAITING: ['IN_PROGRESS', 'QUALITY_CONTROL'],
  QUALITY_CONTROL: ['IN_PROGRESS', 'READY'], READY: ['QUALITY_CONTROL', 'PAYMENT_WAITING', 'DELIVERED'],
  PAYMENT_WAITING: ['QUALITY_CONTROL', 'DELIVERED'], DELIVERED: [], CANCELLED: [],
};
export function assertTransition(from: ServiceOrderStatus, to: ServiceOrderStatus) {
  if (from !== to && !transitions[from]?.includes(to)) throw new BadRequestException('Önceki servis adımları tamamlanmadan bu aşamaya geçilemez.');
}
export function assertOpen(status: ServiceOrderStatus) {
  if (status === 'DELIVERED' || status === 'CANCELLED') throw new BadRequestException('Kapanmış iş emri değiştirilemez. Yeni servis kaydı açın.');
}
