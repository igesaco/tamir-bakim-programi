import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  FeatureKey,
  PaymentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  randomInt,
} from 'crypto';

import {
  nationalIdFingerprint,
} from '../customers/customer-identity';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { PrismaService } from '../prisma/prisma.service';
import { StartPortalAccessDto } from './dto/start-portal-access.dto';
import { VerifyPortalAccessDto } from './dto/verify-portal-access.dto';

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  private maskPhone(
    phone: string,
  ) {
    const digits =
      phone.replace(/\D/g, '');

    if (digits.length < 4) {
      return '***';
    }

    return `*** *** ** ${digits.slice(-2)}`;
  }

  private async sendOtp(
    phone: string,
    code: string,
  ) {
    if (
      process.env.NODE_ENV !==
        'production' ||
      process.env.CUSTOMER_PORTAL_OTP_MODE ===
        'development'
    ) {
      return {
        developmentCode:
          code,
      };
    }

    const webhookUrl =
      process.env.PORTAL_OTP_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new ServiceUnavailableException(
        'SMS doğrulama servisi henüz yapılandırılmamış.',
      );
    }

    const response =
      await fetch(
        webhookUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            phone,
            message:
              `Tamir Bakım doğrulama kodunuz: ${code}. Kod 5 dakika geçerlidir.`,
          }),
        },
      );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Doğrulama kodu gönderilemedi.',
      );
    }

    return {};
  }

  async start(
    dto: StartPortalAccessDto,
  ) {
    const fingerprint =
      nationalIdFingerprint(
        dto.nationalId,
      );

    const plate =
      dto.plate
        .trim()
        .toUpperCase();

    const compactPlate =
      plate.replace(
        /\s+/g,
        '',
      );

    const vehicles =
      await this.prisma.vehicle.findMany({
        where: {
          OR: [
            {
              plate: {
                equals: plate,
                mode: 'insensitive',
              },
            },
            {
              plate: {
                equals:
                  compactPlate,
                mode: 'insensitive',
              },
            },
          ],
          customer: {
            nationalIdHash:
              fingerprint.hash,
            portalEnabled: true,
          },
          organization: {
            active: true,
          },
        },
        include: {
          customer: true,
        },
        take: 3,
      });

    const vehicle =
      vehicles[0];

    if (
      !vehicle ||
      !vehicle.customer.phone
    ) {
      throw new BadRequestException(
        'Bilgiler doğrulanamadı veya portal erişimi hazır değil.',
      );
    }

    const features =
      await this.entitlementsService.getEffectiveFeatures(
        vehicle.organizationId,
      );

    if (
      !features.includes(
        FeatureKey.CUSTOMER_PORTAL,
      )
    ) {
      throw new ForbiddenException(
        'Müşteri portalı bu işletmenin paketinde aktif değil.',
      );
    }

    const recentCount =
      await this.prisma.customerPortalChallenge.count({
        where: {
          customerId:
            vehicle.customerId,
          vehicleId:
            vehicle.id,
          createdAt: {
            gte: new Date(
              Date.now() -
                15 * 60 * 1000,
            ),
          },
        },
      });

    if (recentCount >= 5) {
      throw new BadRequestException(
        'Çok fazla doğrulama isteği yapıldı. Lütfen daha sonra tekrar deneyin.',
      );
    }

    const code =
      String(
        randomInt(
          100000,
          1000000,
        ),
      );

    const codeHash =
      await bcrypt.hash(
        code,
        10,
      );

    const challenge =
      await this.prisma.customerPortalChallenge.create({
        data: {
          customerId:
            vehicle.customerId,
          vehicleId:
            vehicle.id,
          codeHash,
          expiresAt:
            new Date(
              Date.now() +
                5 * 60 * 1000,
            ),
        },
      });

    try {
      const delivery =
        await this.sendOtp(
          vehicle.customer.phone,
          code,
        );

      return {
        challengeId:
          challenge.id,
        expiresInSeconds:
          300,
        maskedPhone:
          this.maskPhone(
            vehicle.customer.phone,
          ),
        ...delivery,
      };
    } catch (error) {
      await this.prisma.customerPortalChallenge.delete({
        where: {
          id: challenge.id,
        },
      });

      throw error;
    }
  }

  async verify(
    dto: VerifyPortalAccessDto,
  ) {
    const challenge =
      await this.prisma.customerPortalChallenge.findUnique({
        where: {
          id:
            dto.challengeId,
        },
        include: {
          customer: true,
          vehicle: true,
        },
      });

    if (
      !challenge ||
      challenge.verifiedAt ||
      challenge.expiresAt <
        new Date() ||
      challenge.attempts >= 5
    ) {
      throw new BadRequestException(
        'Doğrulama isteği geçersiz veya süresi dolmuş.',
      );
    }

    const valid =
      await bcrypt.compare(
        dto.code,
        challenge.codeHash,
      );

    if (!valid) {
      await this.prisma.customerPortalChallenge.update({
        where: {
          id:
            challenge.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException(
        'Doğrulama kodu hatalı.',
      );
    }

    await this.prisma.customerPortalChallenge.update({
      where: {
        id:
          challenge.id,
      },
      data: {
        verifiedAt:
          new Date(),
      },
    });

    const token =
      await this.jwtService.signAsync(
        {
          actorType:
            'CUSTOMER_PORTAL',
          customerId:
            challenge.customerId,
          vehicleId:
            challenge.vehicleId,
          organizationId:
            challenge.customer.organizationId,
        },
        {
          secret:
            process.env.CUSTOMER_PORTAL_JWT_SECRET ||
            process.env.JWT_SECRET,
          expiresIn: '30m',
        },
      );

    return {
      token,
      expiresInSeconds:
        1800,
    };
  }

  async getPortalData(
    customerId: string,
    vehicleId: string,
    organizationId: string,
  ) {
    const customer =
      await this.prisma.customer.findFirstOrThrow({
        where: {
          id: customerId,
          organizationId,
          portalEnabled: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          address: true,
          nationalIdLast4: true,
        },
      });

    const vehicle =
      await this.prisma.vehicle.findFirstOrThrow({
        where: {
          id: vehicleId,
          customerId,
          organizationId,
        },
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
          modelYear: true,
          fuelType: true,
          transmission: true,
          mileage: true,
        },
      });

    const [
      items,
      payments,
    ] = await Promise.all([
      this.prisma.serviceOrderItem.findMany({
        where: {
          serviceOrder: {
            customerId,
            organizationId,
          },
        },
        select: {
          grossTotal: true,
          totalPrice: true,
          vatAmount: true,
        },
      }),
      this.prisma.payment.findMany({
        where: {
          customerId,
          organizationId,
        },
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          reference: true,
          paidAt: true,
          createdAt: true,
          serviceOrder: {
            select: {
              orderNumber: true,
            },
          },
          quote: {
            select: {
              quoteNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const billed =
      items.reduce(
        (sum, item) => {
          const gross =
            Number(
              item.grossTotal ||
                0,
            );

          return (
            sum +
            (gross > 0
              ? gross
              : Number(
                  item.totalPrice ||
                    0,
                ) +
                Number(
                  item.vatAmount ||
                    0,
                ))
          );
        },
        0,
      );

    const paid =
      payments
        .filter(
          (payment) =>
            payment.status ===
            PaymentStatus.PAID,
        )
        .reduce(
          (sum, payment) =>
            sum +
            Number(
              payment.amount,
            ),
          0,
        );

    return {
      customer,
      vehicle,
      currentAccount: {
        billed,
        paid,
        openBalance:
          Math.max(
            0,
            billed - paid,
          ),
      },
      payments,
    };
  }
}
