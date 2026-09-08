import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeatureKey } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getEffectiveFeatures(
    organizationId: string,
  ) {
    const organization =
      await this.prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
        include: {
          package: true,
          featureOverrides: true,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'İşletme bulunamadı.',
      );
    }

    const features =
      new Set<FeatureKey>(
        organization.package?.features ??
          [],
      );

    for (
      const override of
        organization.featureOverrides
    ) {
      if (override.enabled) {
        features.add(
          override.feature,
        );
      } else {
        features.delete(
          override.feature,
        );
      }
    }

    return Array.from(features);
  }

  async getOrganizationAccess(
    organizationId: string,
  ) {
    const organization =
      await this.prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
        include: {
          package: true,
          featureOverrides: {
            orderBy: {
              feature: 'asc',
            },
          },
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'İşletme bulunamadı.',
      );
    }

    return {
      organizationId,
      package:
        organization.package,
      overrides:
        organization.featureOverrides,
      features:
        await this.getEffectiveFeatures(
          organizationId,
        ),
    };
  }
}
