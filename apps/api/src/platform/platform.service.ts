import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  FeatureKey,
  PlatformRole,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { EntitlementsService } from '../entitlements/entitlements.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformService
  implements OnModuleInit
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async onModuleInit() {
    const email =
      process.env.PLATFORM_FOUNDER_EMAIL
        ?.trim()
        .toLowerCase();

    const password =
      process.env.PLATFORM_FOUNDER_PASSWORD;

    if (!email || !password) {
      return;
    }

    const existing =
      await this.prisma.platformUser.findUnique({
        where: { email },
      });

    if (existing) {
      return;
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    await this.prisma.platformUser.create({
      data: {
        firstName:
          process.env.PLATFORM_FOUNDER_FIRST_NAME
            ?.trim() ||
          'İGESA',
        lastName:
          process.env.PLATFORM_FOUNDER_LAST_NAME
            ?.trim() ||
          'Kurucu',
        email,
        passwordHash,
        role:
          PlatformRole.FOUNDER,
      },
    });
  }

  async login(
    emailValue: string,
    password: string,
  ) {
    const email =
      emailValue
        .trim()
        .toLowerCase();

    const user =
      await this.prisma.platformUser.findUnique({
        where: { email },
      });

    if (
      !user ||
      !user.active
    ) {
      throw new UnauthorizedException(
        'Platform e-posta veya şifre hatalı.',
      );
    }

    const valid =
      await bcrypt.compare(
        password,
        user.passwordHash,
      );

    if (!valid) {
      throw new UnauthorizedException(
        'Platform e-posta veya şifre hatalı.',
      );
    }

    const token =
      await this.jwtService.signAsync({
        sub: user.id,
        actorType: 'PLATFORM',
        platformRole: user.role,
        tokenVersion:
          user.tokenVersion,
      });

    return {
      token,
      user: {
        id: user.id,
        firstName:
          user.firstName,
        lastName:
          user.lastName,
        email:
          user.email,
        platformRole:
          user.role,
        actorType:
          'PLATFORM',
      },
    };
  }

  async me(id: string) {
    const user =
      await this.prisma.platformUser.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Platform kullanıcısı bulunamadı.',
      );
    }

    return {
      ...user,
      platformRole:
        user.role,
      actorType:
        'PLATFORM',
    };
  }

  listPackages() {
    return this.prisma.servicePackage.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async listOrganizations() {
    const organizations =
      await this.prisma.organization.findMany({
        include: {
          package: true,
          featureOverrides: true,
          _count: {
            select: {
              branches: true,
              users: true,
              customers: true,
              vehicles: true,
              serviceOrders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    return Promise.all(
      organizations.map(
        async (organization) => ({
          ...organization,
          effectiveFeatures:
            await this.entitlementsService.getEffectiveFeatures(
              organization.id,
            ),
        }),
      ),
    );
  }

  async setPackage(
    organizationId: string,
    packageId: string,
  ) {
    const packageRecord =
      await this.prisma.servicePackage.findFirst({
        where: {
          id: packageId,
          active: true,
        },
      });

    if (!packageRecord) {
      throw new BadRequestException(
        'Paket bulunamadı veya aktif değil.',
      );
    }

    await this.prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        packageId:
          packageRecord.id,
      },
    });

    return this.entitlementsService.getOrganizationAccess(
      organizationId,
    );
  }

  async setFeatureOverride(
    organizationId: string,
    feature: FeatureKey,
    enabled: boolean,
  ) {
    await this.prisma.organization.findUniqueOrThrow({
      where: {
        id: organizationId,
      },
    });

    await this.prisma.organizationFeatureOverride.upsert({
      where: {
        organizationId_feature: {
          organizationId,
          feature,
        },
      },
      create: {
        organizationId,
        feature,
        enabled,
      },
      update: {
        enabled,
      },
    });

    return this.entitlementsService.getOrganizationAccess(
      organizationId,
    );
  }

  async removeFeatureOverride(
    organizationId: string,
    feature: FeatureKey,
  ) {
    await this.prisma.organizationFeatureOverride.deleteMany({
      where: {
        organizationId,
        feature,
      },
    });

    return this.entitlementsService.getOrganizationAccess(
      organizationId,
    );
  }

  async impersonateOrganization(
    platformUserId: string,
    organizationId: string,
  ) {
    const [
      platformUser,
      owner,
    ] = await Promise.all([
      this.prisma.platformUser.findUnique({
        where: {
          id: platformUserId,
        },
      }),
      this.prisma.user.findFirst({
        where: {
          organizationId,
          role:
            UserRole.OWNER,
          active: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    if (
      !platformUser ||
      !platformUser.active
    ) {
      throw new UnauthorizedException(
        'Platform oturumu geçerli değil.',
      );
    }

    if (!owner) {
      throw new BadRequestException(
        'Bu işletmede aktif kurucu hesabı bulunamadı.',
      );
    }

    const token =
      await this.jwtService.signAsync({
        sub: owner.id,
        actorType:
          'TENANT_IMPERSONATION',
        platformUserId:
          platformUser.id,
        platformTokenVersion:
          platformUser.tokenVersion,
        userTokenVersion:
          owner.tokenVersion,
        organizationId:
          owner.organizationId,
        branchId:
          owner.branchId,
        role:
          owner.role,
      });

    return {
      token,
      organizationId,
      ownerUserId:
        owner.id,
      actorType:
        'TENANT_IMPERSONATION',
    };
  }
}
