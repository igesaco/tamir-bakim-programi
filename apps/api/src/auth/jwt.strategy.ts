import 'dotenv/config';

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FeatureKey, PermissionKey } from '@prisma/client';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { EntitlementsService } from '../entitlements/entitlements.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
    private readonly permissionsService: PermissionsService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    if (
      payload.actorType ===
      'PLATFORM'
    ) {
      const platformUser =
        await this.prisma.platformUser.findUnique({
          where: {
            id: payload.sub,
          },
        });

      if (
        !platformUser ||
        !platformUser.active ||
        Number(
          payload.tokenVersion ??
            -1,
        ) !==
          platformUser.tokenVersion
      ) {
        throw new UnauthorizedException(
          'Platform oturumu artık geçerli değil.',
        );
      }

      return {
        sub:
          platformUser.id,
        email:
          platformUser.email,
        actorType:
          'PLATFORM',
        platformRole:
          platformUser.role,
      };
    }

    const user =
      await this.usersService.findById(
        payload.sub,
      );

    if (
      !user ||
      !user.active ||
      !user.organization?.active
    ) {
      throw new UnauthorizedException(
        'Kullanıcı oturumu artık geçerli değil.',
      );
    }

    if (
      payload.actorType ===
      'TENANT_IMPERSONATION'
    ) {
      const platformUser =
        await this.prisma.platformUser.findUnique({
          where: {
            id:
              payload.platformUserId,
          },
        });

      if (
        !platformUser ||
        !platformUser.active ||
        Number(
          payload.platformTokenVersion ??
            -1,
        ) !==
          platformUser.tokenVersion ||
        Number(
          payload.userTokenVersion ??
            -1,
        ) !==
          user.tokenVersion
      ) {
        throw new UnauthorizedException(
          'Ajans erişim oturumu artık geçerli değil.',
        );
      }

      const features =
        Object.values(
          FeatureKey,
        );

      const permissions =
        Object.values(
          PermissionKey,
        );

      return {
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId:
          user.organizationId,
        branchId:
          user.branchId,
        features,
        permissions,
        actorType:
          'TENANT_IMPERSONATION',
        platformUserId:
          platformUser.id,
        platformRole:
          platformUser.role,
        tokenVersion:
          user.tokenVersion,
      };
    }

    if (
      Number(
        payload.tokenVersion ?? -1,
      ) !== user.tokenVersion
    ) {
      throw new UnauthorizedException(
        'Oturum güvenlik nedeniyle sonlandırıldı. Lütfen yeniden giriş yapın.',
      );
    }

    const features =
      await this.entitlementsService.getEffectiveFeatures(
        user.organizationId,
      );

    const permissions =
      await this.permissionsService.getEffectivePermissions(
        user.organizationId,
        user.role,
      );

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId:
        user.organizationId,
      branchId:
        user.branchId,
      features,
      permissions,
      actorType: 'TENANT',
      tokenVersion:
        user.tokenVersion,
    };
  }
}
