import { atomic } from '../workflow/transaction';
import { applyQuoteStatus } from '../workflow/quote-status';
import { quoteBalance } from '../workflow/finance';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  FeatureKey,
  MaintenancePlanStatus,
  NotificationChannel,
  NotificationStatus,
  PaymentStatus,
  QuoteStatus,
  ServiceOrderStatus,
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
import { StartPortalQrAccessDto } from './dto/start-portal-qr-access.dto';
import { StartPortalPhoneAccessDto } from './dto/start-portal-phone-access.dto';
import { VerifyPortalAccessDto } from './dto/verify-portal-access.dto';
import { CheckWhatsappAccessDto } from './dto/check-whatsapp-access.dto';
import {
  extractWhatsappCode,
  validWhatsappSignature,
} from './whatsapp-verification';

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  private normalizePhone(
    phone: string,
  ) {
    let digits =
      phone.replace(/\D/g, '');

    if (
      digits.length === 12 &&
      digits.startsWith('90')
    ) {
      digits =
        digits.slice(2);
    }

    if (
      digits.length === 11 &&
      digits.startsWith('0')
    ) {
      digits =
        digits.slice(1);
    }

    return digits;
  }

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
    channel:
      | 'SMS'
      | 'WHATSAPP' = 'SMS',
    whatsappPhone?: string | null,
  ) {
    const testPhone =
      process.env.CUSTOMER_PORTAL_TEST_PHONE
        ? this.normalizePhone(
            process.env.CUSTOMER_PORTAL_TEST_PHONE,
          )
        : '';

    const isTestPhone =
      process.env.CUSTOMER_PORTAL_TEST_MODE ===
        'true' &&
      testPhone &&
      this.normalizePhone(
        phone,
      ) === testPhone;

    if (
      process.env.NODE_ENV !==
        'production' ||
      isTestPhone
    ) {
      return {
        deliveryChannel:
          channel,
        developmentCode:
          code,
      };
    }

    if (channel === 'WHATSAPP') {
      if (
        !process.env.WHATSAPP_APP_SECRET ||
        !process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      ) {
        throw new ServiceUnavailableException(
          'WhatsApp doğrulaması henüz etkinleştirilmemiş. Lütfen SMS seçeneğini kullanın.',
        );
      }

      const destination =
        this.normalizePhone(
          whatsappPhone || '',
        );

      if (destination.length < 10) {
        throw new ServiceUnavailableException(
          'İşletmenin WhatsApp doğrulama numarası henüz ayarlanmamış.',
        );
      }

      const message =
        `Tamir Bakım giriş doğrulaması: TB-${code}`;

      return {
        deliveryChannel:
          'WHATSAPP',
        whatsappUrl:
          `https://wa.me/90${destination}?text=${encodeURIComponent(message)}`,
        pollingIntervalMs:
          2000,
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

  async startFromPhone(
    dto: StartPortalPhoneAccessDto,
  ) {
    const channel =
      dto.channel || 'SMS';
    const normalized =
      this.normalizePhone(
        dto.phone,
      );

    if (normalized.length < 10) {
      throw new BadRequestException(
        'Telefon numarası geçersiz.',
      );
    }

    const candidates = [
      normalized,
      `0${normalized}`,
      `90${normalized}`,
      `+90${normalized}`,
    ];

    const customers =
      await this.prisma.customer.findMany({
        where: {
          phone: {
            in: candidates,
          },
          portalEnabled: true,
          organization: {
            active: true,
          },
          vehicles: {
            some: {},
          },
        },
        include: {
          organization: {
            select: {
              whatsappPhone: true,
            },
          },
          vehicles: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },

      });

    const eligible = [] as typeof customers;
    for (const candidate of customers) {
      const enabled = await this.entitlementsService.getEffectiveFeatures(candidate.organizationId);
      if (enabled.includes(FeatureKey.CUSTOMER_PORTAL)) eligible.push(candidate);
    }
    if (eligible.length > 1) throw new BadRequestException('Giriş yapılacak servisi belirlemek için aracınızın bakım kartındaki QR kodunu okutun.');
    const customer =
      eligible.find(
        (item) =>
          item.phone &&
          this.normalizePhone(
            item.phone,
          ) === normalized &&
          item.vehicles.length > 0,
      );

    const vehicle =
      customer?.vehicles[0];

    if (
      !customer ||
      !vehicle ||
      !customer.phone
    ) {
      throw new BadRequestException(
        'Bilgiler doğrulanamadı. Servis kaydındaki telefon numaranızı kontrol edin.',
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
      throw new ForbiddenException(
        'Müşteri uygulaması bu işletme için aktif değil.',
      );
    }

    const recentCount =
      await this.prisma.customerPortalChallenge.count({
        where: {
          customerId:
            customer.id,
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
            customer.id,
          vehicleId:
            vehicle.id,
          codeHash,
          channel,
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
          customer.phone,
          code,
          channel,
          customer.organization
            .whatsappPhone,
        );

      return {
        challengeId:
          challenge.id,
        expiresInSeconds:
          300,
        maskedPhone:
          this.maskPhone(
            customer.phone,
          ),
        source:
          'CUSTOMER_APP_PHONE',
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

  async startFromQr(
    dto: StartPortalQrAccessDto,
  ) {
    const channel =
      dto.channel || 'SMS';
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          qrToken:
            dto.qrToken.trim(),
          qrActive: true,
          customer: {
            portalEnabled: true,
          },
          organization: {
            active: true,
          },
        },
        include: {
          customer: true,
          organization: {
            select: {
              whatsappPhone: true,
            },
          },
        },
      });

    const enteredPhone =
      this.normalizePhone(
        dto.phone,
      );

    const registeredPhone =
      vehicle?.customer.phone
        ? this.normalizePhone(
            vehicle.customer.phone,
          )
        : '';

    if (
      !vehicle ||
      !registeredPhone ||
      enteredPhone.length < 10 ||
      enteredPhone !==
        registeredPhone
    ) {
      throw new BadRequestException(
        'Bilgiler doğrulanamadı. Servis kaydındaki telefon numaranızı kontrol edin.',
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
          channel,
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
          vehicle.customer.phone!,
          code,
          channel,
          vehicle.organization
            .whatsappPhone,
        );

      return {
        challengeId:
          challenge.id,
        expiresInSeconds:
          300,
        maskedPhone:
          this.maskPhone(
            vehicle.customer.phone!,
          ),
        source:
          'MAINTENANCE_CARD_QR',
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

  verifyWhatsappWebhook(
    mode: string,
    token: string,
    challenge: string,
  ) {
    const expected =
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (
      mode !== 'subscribe' ||
      !expected ||
      token !== expected
    ) {
      throw new ForbiddenException(
        'WhatsApp webhook doğrulaması geçersiz.',
      );
    }

    return challenge;
  }

  async handleWhatsappWebhook(
    payload: any,
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    const appSecret =
      process.env.WHATSAPP_APP_SECRET || '';

    if (
      !validWhatsappSignature(
        rawBody,
        signature,
        appSecret,
      )
    ) {
      throw new ForbiddenException(
        'WhatsApp webhook imzası geçersiz.',
      );
    }

    const messages =
      (payload?.entry || []).flatMap(
        (entry: any) =>
          (entry?.changes || []).flatMap(
            (change: any) =>
              change?.value?.messages || [],
          ),
      );

    let confirmed = 0;

    for (const message of messages) {
      const code =
        extractWhatsappCode(
          message?.text?.body || '',
        );
      const normalized =
        this.normalizePhone(
          message?.from || '',
        );

      if (
        !code ||
        normalized.length < 10
      ) {
        continue;
      }

      const challenges =
        await this.prisma.customerPortalChallenge.findMany({
          where: {
            channel: 'WHATSAPP',
            verifiedAt: null,
            whatsappConfirmedAt: null,
            expiresAt: {
              gt: new Date(),
            },
            customer: {
              phone: {
                endsWith:
                  normalized.slice(-4),
              },
            },
          },
          include: {
            customer: {
              select: {
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        });

      for (const candidate of challenges) {
        if (
          !candidate.customer.phone ||
          this.normalizePhone(
            candidate.customer.phone,
          ) !== normalized
        ) {
          continue;
        }

        if (
          !(await bcrypt.compare(
            code,
            candidate.codeHash,
          ))
        ) {
          continue;
        }

        const result =
          await this.prisma.customerPortalChallenge.updateMany({
            where: {
              id: candidate.id,
              verifiedAt: null,
              whatsappConfirmedAt: null,
              expiresAt: {
                gt: new Date(),
              },
            },
            data: {
              whatsappConfirmedAt:
                new Date(),
            },
          });

        confirmed += result.count;
        break;
      }
    }

    return {
      received: true,
      confirmed,
    };
  }

  async checkWhatsappAccess(
    dto: CheckWhatsappAccessDto,
  ) {
    const challenge =
      await this.prisma.customerPortalChallenge.findUnique({
        where: {
          id: dto.challengeId,
        },
        include: {
          customer: true,
        },
      });

    if (
      !challenge ||
      challenge.channel !==
        'WHATSAPP' ||
      challenge.expiresAt <
        new Date()
    ) {
      throw new BadRequestException(
        'WhatsApp doğrulama isteği geçersiz veya süresi dolmuş.',
      );
    }

    if (!challenge.whatsappConfirmedAt) {
      return {
        confirmed: false,
      };
    }

    const claimed =
      await this.prisma.customerPortalChallenge.updateMany({
        where: {
          id: challenge.id,
          verifiedAt: null,
          whatsappConfirmedAt: {
            not: null,
          },
        },
        data: {
          verifiedAt: new Date(),
        },
      });

    if (claimed.count !== 1) {
      throw new BadRequestException(
        'WhatsApp doğrulaması daha önce kullanılmış.',
      );
    }

    const mobileSession =
      dto.client === 'MOBILE';
    const token =
      await this.jwtService.signAsync(
        {
          actorType:
            mobileSession
              ? 'CUSTOMER_APP'
              : 'CUSTOMER_PORTAL',
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
          expiresIn:
            mobileSession
              ? '30d'
              : '30m',
        },
      );

    return {
      confirmed: true,
      token,
      expiresInSeconds:
        mobileSession
          ? 2592000
          : 1800,
    };
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

    if (
      challenge.channel ===
        'WHATSAPP' &&
      !challenge.whatsappConfirmedAt &&
      process.env.NODE_ENV ===
        'production'
    ) {
      throw new BadRequestException(
        'WhatsApp mesajı henüz doğrulanmadı.',
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

    const mobileSession =
      dto.client ===
      'MOBILE';

    const token =
      await this.jwtService.signAsync(
        {
          actorType:
            mobileSession
              ? 'CUSTOMER_APP'
              : 'CUSTOMER_PORTAL',
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
          expiresIn:
            mobileSession
              ? '30d'
              : '30m',
        },
      );

    return {
      token,
      expiresInSeconds:
        mobileSession
          ? 2592000
          : 1800,
    };
  }

  async getCustomerVehicles(
    customerId: string,
    organizationId: string,
  ) {
    await this.prisma.customer.findFirstOrThrow({
      where: {
        id: customerId,
        organizationId,
        portalEnabled: true,
      },
      select: {
        id: true,
      },
    });

    return this.prisma.vehicle.findMany({
      where: {
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
        mileageUpdatedAt: true,
        qrActive: true,
        media: {
          where: {
            customerVisible: true,
            type: {
              in: [
                'VEHICLE',
                'ACCEPTANCE',
                'DAMAGE',
                'ENGINE',
                'BEFORE',
                'AFTER',
                'ODOMETER',
              ],
            },
          },
          select: {
            id: true,
            type: true,
            storageKey: true,
            fileName: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 6,
        },
        maintenancePlans: {
          where: {
            status:
              MaintenancePlanStatus.ACTIVE,
          },
          select: {
            id: true,
            title: true,
            nextDueKm: true,
            nextDueDate: true,
          },
          orderBy: [
            {
              nextDueDate: 'asc',
            },
            {
              nextDueKm: 'asc',
            },
          ],
          take: 3,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateCustomerMileage(
    customerId: string,
    vehicleId: string,
    organizationId: string,
    mileage: number,
  ) {
    return atomic(this.prisma, organizationId, async tx => {
      const vehicle = await tx.vehicle.findFirst({
        where: { id: vehicleId, customerId, organizationId },
      });
      if (!vehicle) {
        throw new ForbiddenException('Araç hesabınıza ait değil.');
      }
      if (mileage < vehicle.mileage) {
        throw new BadRequestException(
          'Kilometre mevcut kayıttan düşük olamaz.',
        );
      }

      const updated = await tx.vehicle.update({
        where: { id: vehicle.id },
        data: { mileage, mileageUpdatedAt: new Date() },
        select: { id: true, mileage: true, mileageUpdatedAt: true },
      });
      await tx.notification.create({
        data: {
          organizationId,
          branchId: vehicle.branchId,
          customerId,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          title: 'Kilometre bilgisi güncellendi',
          message: `${vehicle.plate} plakalı aracın kilometresi ${mileage.toLocaleString('tr-TR')} olarak kaydedildi.`,
        },
      });
      return updated;
    });
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
          mileageUpdatedAt: true,
          media: {
            where: {
              customerVisible: true,
              type: {
                in: [
                  'VEHICLE',
                  'ACCEPTANCE',
                  'DAMAGE',
                  'ENGINE',
                  'BEFORE',
                  'AFTER',
                  'ODOMETER',
                ],
              },
            },
            select: {
              id: true,
              type: true,
              storageKey: true,
              fileName: true,
              description: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
        },
      });

    const [
      payments,
      maintenanceHistory,
      maintenancePlans,
      activeServiceOrders,
    ] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          customerId,
          organizationId,
          OR: [
            {
              serviceOrder: {
                vehicleId,
              },
            },
            {
              quote: {
                vehicleId,
              },
            },
          ],
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
      this.prisma.maintenanceRecord.findMany({
        where: {
          organizationId,
          vehicleId,
        },
        select: {
          id: true,
          mileage: true,
          performedAt: true,
          totalAmount: true,
          notes: false,
          items: {
            select: {
              id: true,
              name: true,
              description: true,
              quantity: true,
            },
          },
        },
        orderBy: {
          performedAt: 'desc',
        },
        take: 20,
      }),
      this.prisma.maintenancePlan.findMany({
        where: {
          organizationId,
          vehicleId,
          status:
            MaintenancePlanStatus.ACTIVE,
        },
        select: {
          id: true,
          title: true,
          category: true,
          description: true,
          intervalKm: true,
          intervalMonths: true,
          lastKm: true,
          lastDate: true,
          nextDueKm: true,
          nextDueDate: true,
          estimatedPriceMin: true,
          estimatedPriceMax: true,
        },
        orderBy: [
          {
            nextDueDate: 'asc',
          },
          {
            nextDueKm: 'asc',
          },
        ],
      }),
      this.prisma.serviceOrder.findMany({
        where: {
          customerId,
          organizationId,
          vehicleId,
          status: {
            notIn: [
              ServiceOrderStatus.DELIVERED,
              ServiceOrderStatus.CANCELLED,
            ],
          },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          mileage: true,
          complaint: true,
          estimatedDeliveryAt: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              type: true,
              name: true,
              description: true,
              quantity: true,
              completed: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          media: {
            where: {
              customerVisible: true,
            },
            select: {
              id: true,
              type: true,
              storageKey: true,
              fileName: true,
              description: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          quotes: {
            where: {
              status: {
                in: [
                  QuoteStatus.SENT,
                  QuoteStatus.APPROVED,
                  QuoteStatus.PARTIALLY_APPROVED,
                ],
              },
            },
            select: {
              id: true,
              quoteNumber: true,
              status: true,
              subtotal: true,
              discountTotal: true,
              taxTotal: true,
              total: true,
              notes: false,
              sentAt: true,
              approvedAt: true,
              items: {
                select: {
                  id: true,
                  type: true,
                  name: true,
                  quantity: true,
                  unitPrice: true,
                  totalPrice: true,
                  vatAmount: true,
                  grossTotal: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 3,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

    const approvedQuotes = await this.prisma.quote.findMany({ where: { organizationId, customerId, vehicleId, status: QuoteStatus.APPROVED }, select: { total: true } });
    const legacyOrders = await this.prisma.serviceOrder.findMany({ where: { organizationId, customerId, vehicleId, status: { not: ServiceOrderStatus.CANCELLED }, quotes: { none: {} } }, include: { items: true } });
    const billed = approvedQuotes.reduce((sum, q) => sum + Number(q.total), 0)
      + legacyOrders.reduce((sum, order) => sum + order.items.reduce((n, i) => n + (Number(i.grossTotal) || Number(i.totalPrice) + Number(i.vatAmount)), 0), 0);

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

    const now =
      new Date();

    const dueSoonAt =
      new Date(
        now.getTime() +
          30 *
            24 *
            60 *
            60 *
            1000,
      );

    const customerMaintenancePlans =
      maintenancePlans.map(
        (plan) => {
          const remainingKm =
            plan.nextDueKm ===
              null ||
            plan.nextDueKm ===
              undefined
              ? null
              : plan.nextDueKm -
                vehicle.mileage;

          const kmOverdue =
            remainingKm !== null &&
            remainingKm <= 0;

          const dateOverdue =
            Boolean(
              plan.nextDueDate &&
                plan.nextDueDate <
                  now,
            );

          const kmDueSoon =
            remainingKm !== null &&
            remainingKm > 0 &&
            remainingKm <= 1000;

          const dateDueSoon =
            Boolean(
              plan.nextDueDate &&
                plan.nextDueDate >=
                  now &&
                plan.nextDueDate <=
                  dueSoonAt,
            );

          return {
            ...plan,
            remainingKm,
            alertStatus:
              kmOverdue ||
              dateOverdue
                ? 'OVERDUE'
                : kmDueSoon ||
                    dateDueSoon
                  ? 'DUE_SOON'
                  : 'UPCOMING',
          };
        },
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
      currentServiceOrder:
        activeServiceOrders[0] ??
        null,
      activeServiceOrders,
      maintenanceHistory,
      maintenancePlans:
        customerMaintenancePlans,
      payments,
    };
  }
  approveCustomerQuote(customerId: string, organizationId: string, quoteId: string) {
    return atomic(this.prisma, organizationId, async tx => {
      const quote = await applyQuoteStatus(tx, organizationId, quoteId, QuoteStatus.APPROVED, { customerId });
      const { remaining } = await quoteBalance(tx, organizationId, quoteId);
      const order = quote.serviceOrderId ? await tx.serviceOrder.findUnique({ where: { id: quote.serviceOrderId } }) : null;
      return { quote, serviceOrderStatus: order?.status, pendingAmount: remaining };
    });
  }

  async getCustomerNotifications(
    customerId: string,
    organizationId: string,
  ) {
    await this.prisma.customer.findFirstOrThrow({
      where: {
        id: customerId,
        organizationId,
        portalEnabled: true,
      },
      select: {
        id: true,
      },
    });

    return this.prisma.notification.findMany({
      where: {
        customerId,
        organizationId,
      },
      select: {
        id: true,
        title: true,
        message: true,
        status: true,
        serviceOrderId: true,
        createdAt: true,
        readAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  async markCustomerNotificationRead(
    customerId: string,
    organizationId: string,
    notificationId: string,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          customerId,
          organizationId,
        },
      });

    if (!notification) {
      throw new BadRequestException(
        'Bildirim bulunamadı.',
      );
    }

    return this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status:
          NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

}
