import { BadRequestException } from '@nestjs/common';
import { jest } from '@jest/globals';

import { PrismaService } from '../prisma/prisma.service';
import { BranchesService } from './branches.service';

describe('BranchesService', () => {
  function setup() {
    const prisma = {
      branch: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    return {
      prisma,
      service: new BranchesService(prisma as unknown as PrismaService),
    };
  }

  it('normalizes optional values before creating a branch', async () => {
    const { prisma, service } = setup();
    prisma.branch.findFirst.mockResolvedValue(null);
    prisma.branch.create.mockImplementation(async ({ data }: any) => data);

    await expect(service.create('org-1', {
      name: '  Merkez  ', phone: ' ', address: '  Sanayi ', city: ' Ankara ',
    })).resolves.toMatchObject({
      organizationId: 'org-1', name: 'Merkez', phone: null,
      address: 'Sanayi', city: 'Ankara',
    });
  });

  it('returns an actionable error for an existing branch name', async () => {
    const { prisma, service } = setup();
    prisma.branch.findFirst.mockResolvedValue({ id: 'branch-1' });

    await expect(service.create('org-1', { name: 'Merkez' }))
      .rejects.toThrow(new BadRequestException('Bu isimde bir şube zaten bulunuyor.'));
    expect(prisma.branch.create).not.toHaveBeenCalled();
  });

  it('converts a concurrent unique conflict into a user error', async () => {
    const { prisma, service } = setup();
    prisma.branch.findFirst.mockResolvedValue(null);
    prisma.branch.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create('org-1', { name: 'Merkez' }))
      .rejects.toThrow('Bu isimde bir şube zaten bulunuyor.');
  });
});
