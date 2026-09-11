import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  FeatureKey,
  PermissionKey,
  PlatformRole,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { EntitlementsService } from '../entitlements/entitlements.service';
import { defaultPermissionsForRole } from '../permissions/default-role-permissions';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationCustomerDto } from './dto/create-organization-customer.dto';
import { CreatePlatformLedgerEntryDto } from './dto/create-platform-ledger-entry.dto';
import { UpdateOrganizationBrandingDto } from './dto/update-organization-branding.dto';
import { UpdateOrganizationCommercialDto } from './dto/update-organization-commercial.dto';
import { UpdateTenantOwnerDto } from './dto/update-tenant-owner.dto';

const featureDependencies: Partial<Record<FeatureKey, FeatureKey[]>> = {
  [FeatureKey.VEHICLES_QR]: [FeatureKey.CUSTOMERS],
  [FeatureKey.SERVICE_ORDERS]: [FeatureKey.CUSTOMERS, FeatureKey.VEHICLES_QR],
  [FeatureKey.INSPECTIONS]: [FeatureKey.SERVICE_ORDERS],
  [FeatureKey.QUOTES]: [FeatureKey.SERVICE_ORDERS],
  [FeatureKey.INVENTORY]: [FeatureKey.SERVICE_ORDERS],
  [FeatureKey.MAINTENANCE]: [FeatureKey.VEHICLES_QR],
  [FeatureKey.MEDIA]: [FeatureKey.VEHICLES_QR],
  [FeatureKey.CASHIER]: [FeatureKey.SERVICE_ORDERS],
  [FeatureKey.CUSTOMER_PORTAL]: [FeatureKey.CUSTOMERS, FeatureKey.VEHICLES_QR],
};

@Injectable()
export class PlatformService
  implements OnModuleInit
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly entitlementsService: EntitlementsService,
    private readonly permissionsService: PermissionsService,
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

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    await this.prisma.platformUser.upsert({
      where: {
        email,
      },
      create: {
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
        active: true,
      },
      update: {
        firstName:
          process.env.PLATFORM_FOUNDER_FIRST_NAME
            ?.trim() ||
          'İGESA',
        lastName:
          process.env.PLATFORM_FOUNDER_LAST_NAME
            ?.trim() ||
          'Kurucu',
        passwordHash,
        role:
          PlatformRole.FOUNDER,
        active: true,
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

  async createOrganizationCustomer(
    dto: CreateOrganizationCustomerDto,
  ) {
    const ownerEmail =
      dto.ownerEmail
        .trim()
        .toLowerCase();

    const duplicate =
      await this.prisma.user.findUnique({
        where: {
          email: ownerEmail,
        },
      });

    if (duplicate) {
      throw new BadRequestException(
        'Bu e-posta adresiyle zaten bir panel hesabı bulunuyor.',
      );
    }

    let packageId =
      dto.packageId;

    if (packageId) {
      const packageRecord =
        await this.prisma.servicePackage.findFirst({
          where: {
            id: packageId,
            active: true,
          },
        });

      if (!packageRecord) {
        throw new BadRequestException(
          'Seçilen paket bulunamadı veya aktif değil.',
        );
      }
    } else {
      const defaultPackage =
        await this.prisma.servicePackage.findFirst({
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

      packageId =
        defaultPackage?.id;
    }

    const passwordHash =
      await bcrypt.hash(
        dto.ownerPassword,
        12,
      );

    return this.prisma.$transaction(
      async (tx) => {
        const organization =
          await tx.organization.create({
            data: {
              name:
                dto.organizationName.trim(),
              packageId:
                packageId || null,
              contactPersonName:
                dto.contactPersonName?.trim(),
              contactPersonPhone:
                dto.contactPersonPhone?.trim(),
              phone:
                dto.phone?.trim(),
              whatsappPhone:
                dto.whatsappPhone?.trim(),
              email:
                dto.email
                  ?.trim()
                  .toLowerCase(),
              address:
                dto.address?.trim(),
              monthlyFee:
                dto.monthlyFee || 0,
              active: true,
            },
          });

        const branch =
          await tx.branch.create({
            data: {
              organizationId:
                organization.id,
              name:
                'Merkez Şube',
              phone:
                dto.phone?.trim(),
              address:
                dto.address?.trim(),
              active: true,
            },
          });

        const owner =
          await tx.user.create({
            data: {
              organizationId:
                organization.id,
              branchId: null,
              firstName:
                dto.ownerFirstName.trim(),
              lastName:
                dto.ownerLastName.trim(),
              email:
                ownerEmail,
              phone:
                dto.ownerPhone?.trim(),
              passwordHash,
              role:
                UserRole.OWNER,
              active: true,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              active: true,
            },
          });

        return {
          organization,
          branch,
          owner,
        };
      },
    );
  }

  async listOrganizations() {
    const organizations =
      await this.prisma.organization.findMany({
        include: {
          package: true,
          featureOverrides: true,
          rolePermissionOverrides: true,
          users: {
            where: {
              role: UserRole.OWNER,
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              active: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          platformLedgerEntries: {
            orderBy: {
              occurredAt: 'desc',
            },
          },
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
        async (organization) => {
          const ledgerTotals =
            organization.platformLedgerEntries.reduce(
              (totals, entry) => {
                const amount =
                  Number(entry.amount);

                if (
                  entry.type ===
                  'DEBIT'
                ) {
                  totals.debit += amount;
                } else {
                  totals.credit += amount;
                }

                return totals;
              },
              {
                debit: 0,
                credit: 0,
              },
            );

          return {
          ...organization,
          ledgerBalance:
            ledgerTotals.debit -
            ledgerTotals.credit,
          ledgerDebit:
            ledgerTotals.debit,
          ledgerCredit:
            ledgerTotals.credit,
          effectiveFeatures:
            await this.entitlementsService.getEffectiveFeatures(
              organization.id,
            ),
          effectiveRolePermissions:
            await this.permissionsService.getRolePermissionMatrix(
              organization.id,
            ),
          };
        },
      ),
    );
  }

  async updateOrganizationBranding(
    organizationId: string,
    dto: UpdateOrganizationBrandingDto,
  ) {
    return this.prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        logoUrl:
          dto.logoUrl,
        panelTitle:
          dto.panelTitle,
        primaryColor:
          dto.primaryColor,
        secondaryColor:
          dto.secondaryColor,
        sidebarColor:
          dto.sidebarColor,
        defaultPanelMode:
          dto.defaultPanelMode,
        defaultWallpaper:
          dto.defaultWallpaper,
      },
    });
  }

  async updateOrganizationCommercial(
    organizationId: string,
    dto: UpdateOrganizationCommercialDto,
  ) {
    return this.prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        name:
          dto.name,
        email:
          dto.email,
        phone:
          dto.phone,
        whatsappPhone:
          dto.whatsappPhone,
        address:
          dto.address,
        contactPersonName:
          dto.contactPersonName,
        contactPersonPhone:
          dto.contactPersonPhone,
        platformNotes:
          dto.platformNotes,
        monthlyFee:
          dto.monthlyFee,
        active:
          dto.active,
      },
    });
  }

  async listLedger(
    organizationId: string,
  ) {
    await this.prisma.organization.findUniqueOrThrow({
      where: {
        id: organizationId,
      },
    });

    return this.prisma.platformLedgerEntry.findMany({
      where: {
        organizationId,
      },
      orderBy: [
        {
          occurredAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async createLedgerEntry(
    organizationId: string,
    dto: CreatePlatformLedgerEntryDto,
  ) {
    await this.prisma.organization.findUniqueOrThrow({
      where: {
        id: organizationId,
      },
    });

    return this.prisma.platformLedgerEntry.create({
      data: {
        organizationId,
        type:
          dto.type,
        amount:
          dto.amount,
        description:
          dto.description.trim(),
        dueDate:
          dto.dueDate
            ? new Date(dto.dueDate)
            : null,
        occurredAt:
          dto.occurredAt
            ? new Date(dto.occurredAt)
            : new Date(),
      },
    });
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

    const current = new Set(
      await this.entitlementsService.getEffectiveFeatures(
        organizationId,
      ),
    );
    const next = new Set(current);
    if (enabled) next.add(feature);
    else next.delete(feature);

    if (enabled) {
      const missing = (featureDependencies[feature] || [])
        .filter(required => !next.has(required));
      if (missing.length) {
        throw new BadRequestException(
          `${feature} modülü için önce ${missing.join(', ')} modüllerini açın.`,
        );
      }
    } else {
      const dependants = Object.entries(featureDependencies)
        .filter(([candidate, requirements]) =>
          next.has(candidate as FeatureKey) && requirements?.includes(feature),
        )
        .map(([candidate]) => candidate);
      if (dependants.length) {
        throw new BadRequestException(
          `${feature} kapatılamaz. Önce bağlı modülleri kapatın: ${dependants.join(', ')}.`,
        );
      }
    }

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

  async setRolePermission(
    organizationId: string,
    role: UserRole,
    permission: PermissionKey,
    allowed: boolean,
  ) {
    await this.prisma.organization.findUniqueOrThrow({
      where: {
        id: organizationId,
      },
    });

    await this.prisma.organizationRolePermissionOverride.upsert({
      where: {
        organizationId_role_permission: {
          organizationId,
          role,
          permission,
        },
      },
      create: {
        organizationId,
        role,
        permission,
        allowed,
      },
      update: {
        allowed,
      },
    });

    return this.permissionsService.getRolePermissionMatrix(
      organizationId,
    );
  }

  async replaceRolePermissions(
    organizationId: string,
    role: UserRole,
    permissions: PermissionKey[],
  ) {
    await this.prisma.organization.findUniqueOrThrow({
      where: {
        id: organizationId,
      },
    });

    const allowed =
      new Set(
        permissions,
      );

    const allPermissions =
      Object.values(
        PermissionKey,
      );

    await this.prisma.$transaction(
      allPermissions.map(
        (permission) =>
          this.prisma.organizationRolePermissionOverride.upsert({
            where: {
              organizationId_role_permission: {
                organizationId,
                role,
                permission,
              },
            },
            create: {
              organizationId,
              role,
              permission,
              allowed:
                allowed.has(
                  permission,
                ),
            },
            update: {
              allowed:
                allowed.has(
                  permission,
                ),
            },
          }),
      ),
    );

    return this.permissionsService.getRolePermissionMatrix(
      organizationId,
    );
  }

  async resetRolePermissions(
    organizationId: string,
    role: UserRole,
  ) {
    await this.prisma.organizationRolePermissionOverride.deleteMany({
      where: {
        organizationId,
        role,
      },
    });

    return {
      role,
      defaults:
        defaultPermissionsForRole(
          role,
        ),
      matrix:
        await this.permissionsService.getRolePermissionMatrix(
          organizationId,
        ),
    };
  }

  async updateTenantOwnerProfile(
    organizationId: string,
    userId: string,
    dto: UpdateTenantOwnerDto,
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
          role: UserRole.OWNER,
        },
      });

    if (!target) {
      throw new BadRequestException(
        'Kurucu hesabı bulunamadı.',
      );
    }

    const email =
      dto.email
        ?.trim()
        .toLowerCase();

    if (
      email &&
      email !== target.email
    ) {
      const duplicate =
        await this.prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (
        duplicate &&
        duplicate.id !== target.id
      ) {
        throw new BadRequestException(
          'Bu e-posta adresi başka bir panel hesabında kullanılıyor.',
        );
      }
    }

    const emailChanged =
      Boolean(
        email &&
        email !== target.email,
      );

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        firstName:
          dto.firstName?.trim(),
        lastName:
          dto.lastName?.trim(),
        email,
        phone:
          dto.phone?.trim(),
        ...(emailChanged
          ? {
              tokenVersion: {
                increment: 1,
              },
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async setTenantUserActive(
    organizationId: string,
    userId: string,
    active: boolean,
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

    if (!target) {
      throw new BadRequestException(
        'Panel kullanıcısı bulunamadı.',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        active,
        tokenVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        active: true,
      },
    });
  }

  async resetTenantUserPassword(
    organizationId: string,
    userId: string,
    password: string,
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

    if (!target) {
      throw new BadRequestException(
        'Panel kullanıcısı bulunamadı.',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
        tokenVersion: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
    };
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
