import 'dotenv/config';

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';
import { FeatureKey } from '@prisma/client';

import { EntitlementsService } from '../entitlements/entitlements.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerPortalJwtStrategy extends PassportStrategy(
  Strategy,
  'customer-portal-jwt',
) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.CUSTOMER_PORTAL_JWT_SECRET ||
        process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    if (
      payload.actorType !==
      'CUSTOMER_PORTAL'
    ) {
      throw new UnauthorizedException(
        'Müşteri portal oturumu geçerli değil.',
      );
    }

    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id: payload.customerId,
          organizationId:
            payload.organizationId,
          portalEnabled: true,
          vehicles: {
            some: {
              id:
                payload.vehicleId,
            },
          },
        },
        include: {
          organization: true,
        },
      });

    if (
      !customer ||
      !customer.organization.active
    ) {
      throw new UnauthorizedException(
        'Müşteri portal oturumu artık geçerli değil.',
      );
    }

    const features =
      await this.entitlementsService.getEffectiveFeatures(
        customer.organizationId,
      );

    if (
      !features.includes(
        FeatureKey.CUSTOMER_PORTAL,
      )
    ) {
      throw new UnauthorizedException(
        'Müşteri portalı bu işletme için aktif değil.',
      );
    }

    return {
      actorType:
        'CUSTOMER_PORTAL',
      customerId:
        customer.id,
      organizationId:
        customer.organizationId,
      vehicleId:
        payload.vehicleId,
    };
  }
}
