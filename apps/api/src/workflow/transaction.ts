import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Lock before reading balances/status. One tenant's short write transactions
// serialize without blocking other tenants; PostgreSQL releases this on rollback.
export async function lockOrganization(tx: Prisma.TransactionClient, id: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
}

export function atomic<T>(prisma: PrismaService, organizationId: string,
  work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async tx => {
    await lockOrganization(tx, organizationId);
    return work(tx);
  }, { maxWait: 10000, timeout: 20000 });
}
