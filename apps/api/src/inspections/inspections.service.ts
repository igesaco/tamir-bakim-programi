import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FeatureKey,
  InspectionStatus,
  PermissionKey,
  ServiceOrderStatus,
  UserRole,
} from '@prisma/client';

import { EntitlementsService } from '../entitlements/entitlements.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { CreateInspectionItemDto } from './dto/create-inspection-item.dto';
import { CreateMobileIntakeDto } from './dto/create-mobile-intake.dto';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private branchFilter(
    role: UserRole,
    branchId: string | null,
  ) {
    if (
      role === UserRole.SERVICE_ADVISOR
    ) {
      return {
        branchId:
          branchId ??
          '__branch_not_assigned__',
      };
    }

    return {};
  }

  private cleanPhone(
    value?: string,
  ) {
    const digits =
      value?.replace(
        /\D/g,
        '',
      ) || '';

    return digits;
  }

  private roundMoney(
    value: number,
  ) {
    return (
      Math.round(
        (
          value +
          Number.EPSILON
        ) *
          100,
      ) / 100
    );
  }

  private async ensureMobileIntakeAccess(
    organizationId: string,
    role: UserRole,
    dto: CreateMobileIntakeDto,
  ) {
    const [
      features,
      permissions,
    ] =
      await Promise.all([
        this.entitlementsService.getEffectiveFeatures(
          organizationId,
        ),
        this.permissionsService.getEffectivePermissions(
          organizationId,
          role,
        ),
      ]);

    const featureSet =
      new Set(features);

    const permissionSet =
      new Set(permissions);

    const requiredFeatures = [
      FeatureKey.CUSTOMERS,
      FeatureKey.VEHICLES_QR,
      FeatureKey.SERVICE_ORDERS,
      FeatureKey.INSPECTIONS,
    ];

    for (
      const feature of
        requiredFeatures
    ) {
      if (
        !featureSet.has(
          feature,
        )
      ) {
        throw new ForbiddenException(
          'Mobil araç kabul akışı için müşteri, araç, iş emri ve araç kabul modülleri aktif olmalıdır.',
        );
      }
    }

    const requiredPermissions = [
      PermissionKey.CUSTOMER_VIEW,
      PermissionKey.VEHICLE_VIEW,
      PermissionKey.SERVICE_ORDER_CREATE,
      PermissionKey.INSPECTION_MANAGE,
    ];

    if (
      !dto.customerId
    ) {
      requiredPermissions.push(
        PermissionKey.CUSTOMER_CREATE,
      );
    }

    if (
      !dto.vehicleId
    ) {
      requiredPermissions.push(
        PermissionKey.VEHICLE_CREATE,
      );
    }

    if (
      dto.plannedItems?.length
    ) {
      requiredPermissions.push(
        PermissionKey.SERVICE_ORDER_ITEM_MANAGE,
      );
    }

    for (
      const permission of
        requiredPermissions
    ) {
      if (
        !permissionSet.has(
          permission,
        )
      ) {
        throw new ForbiddenException(
          'Bu mobil araç kabul işlemi için gerekli yetkilerden biri hesabınızda kapalı.',
        );
      }
    }
  }

  async createMobileIntake(
    organizationId: string,
    actorBranchId: string | null,
    actorRole: UserRole,
    userId: string,
    dto: CreateMobileIntakeDto,
  ) {
    await this.ensureMobileIntakeAccess(
      organizationId,
      actorRole,
      dto,
    );

    let branchId =
      actorBranchId;

    if (
      actorRole ===
        UserRole.OWNER ||
      actorRole ===
        UserRole.MANAGER
    ) {
      branchId =
        dto.branchId ||
        actorBranchId;
    } else if (
      dto.branchId &&
      dto.branchId !==
        actorBranchId
    ) {
      throw new ForbiddenException(
        'Servis danışmanı yalnızca kendi şubesinde araç kabul yapabilir.',
      );
    }

    if (!branchId) {
      throw new BadRequestException(
        'Araç kabul için şube seçimi gerekli.',
      );
    }

    const branch =
      await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          organizationId,
          active: true,
        },
        select: {
          id: true,
        },
      });

    if (!branch) {
      throw new BadRequestException(
        'Geçerli ve aktif bir şube seçiniz.',
      );
    }

    const resolvedBranchId =
      branch.id;

    if (
      !dto.customerId &&
      (
        !dto.customerFirstName?.trim() ||
        !dto.customerPhone?.trim()
      )
    ) {
      throw new BadRequestException(
        'Yeni müşteri için ad ve telefon bilgisi gerekli.',
      );
    }

    if (
      !dto.vehicleId &&
      (
        !dto.plate?.trim() ||
        !dto.brand?.trim() ||
        !dto.model?.trim()
      )
    ) {
      throw new BadRequestException(
        'Yeni araç için plaka, marka ve model bilgisi gerekli.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        let customer:
          any = null;

        if (
          dto.customerId
        ) {
          customer =
            await tx.customer.findFirst({
              where: {
                id:
                  dto.customerId,
                organizationId,
                ...(actorRole ===
                UserRole.SERVICE_ADVISOR
                  ? {
                      branchId:
                        resolvedBranchId,
                    }
                  : {}),
              },
            });

          if (!customer) {
            throw new BadRequestException(
              'Seçilen müşteri bulunamadı veya erişim yetkiniz yok.',
            );
          }
        } else {
          const phone =
            this.cleanPhone(
              dto.customerPhone,
            );

          const last10 =
            phone.length >= 10
              ? phone.slice(-10)
              : phone;

          const phoneCandidates =
            Array.from(
              new Set(
                [
                  phone,
                  last10,
                  last10
                    ? `0${last10}`
                    : '',
                  last10
                    ? `90${last10}`
                    : '',
                ].filter(
                  Boolean,
                ),
              ),
            );

          customer =
            await tx.customer.findFirst({
              where: {
                organizationId,
                phone: {
                  in:
                    phoneCandidates,
                },
                ...(actorRole ===
                UserRole.SERVICE_ADVISOR
                  ? {
                      branchId:
                        resolvedBranchId,
                    }
                  : {}),
              },
              orderBy: {
                createdAt:
                  'desc',
              },
            });

          if (!customer) {
            customer =
              await tx.customer.create({
                data: {
                  organizationId,
                  branchId:
                    resolvedBranchId,
                  firstName:
                    dto.customerFirstName!
                      .trim(),
                  lastName:
                    dto.customerLastName
                      ?.trim() ||
                    null,
                  phone:
                    phone ||
                    null,
                  email:
                    dto.customerEmail
                      ?.trim()
                      .toLowerCase() ||
                    null,
                  portalEnabled:
                    true,
                },
              });
          }
        }

        let vehicle:
          any = null;

        if (
          dto.vehicleId
        ) {
          vehicle =
            await tx.vehicle.findFirst({
              where: {
                id:
                  dto.vehicleId,
                organizationId,
                customerId:
                  customer.id,
                ...(actorRole ===
                UserRole.SERVICE_ADVISOR
                  ? {
                      branchId:
                        resolvedBranchId,
                    }
                  : {}),
              },
            });

          if (!vehicle) {
            throw new BadRequestException(
              'Seçilen araç müşteriye ait değil veya erişim yetkiniz yok.',
            );
          }
        } else {
          const rawPlate =
            dto.plate!
              .trim()
              .toUpperCase();

          const compactPlate =
            rawPlate.replace(
              /\s+/g,
              '',
            );

          vehicle =
            await tx.vehicle.findFirst({
              where: {
                organizationId,
                OR: [
                  {
                    plate:
                      rawPlate,
                  },
                  {
                    plate:
                      compactPlate,
                  },
                ],
              },
            });

          if (
            vehicle &&
            vehicle.customerId !==
              customer.id
          ) {
            throw new BadRequestException(
              'Bu plaka başka bir müşteri kaydına bağlı.',
            );
          }

          if (!vehicle) {
            vehicle =
              await tx.vehicle.create({
                data: {
                  organizationId,
                  branchId:
                    resolvedBranchId,
                  customerId:
                    customer.id,
                  plate:
                    compactPlate,
                  brand:
                    dto.brand!
                      .trim(),
                  model:
                    dto.model!
                      .trim(),
                  modelYear:
                    dto.modelYear,
                  vin:
                    dto.vin
                      ?.trim()
                      .toUpperCase() ||
                    null,
                  fuelType:
                    dto.fuelType
                      ?.trim() ||
                    null,
                  transmission:
                    dto.transmission
                      ?.trim() ||
                    null,
                  color:
                    dto.color
                      ?.trim() ||
                    null,
                  mileage:
                    dto.mileage,
                },
              });
          }
        }

        if (
          dto.mileage >
          Number(
            vehicle.mileage ||
              0,
          )
        ) {
          vehicle =
            await tx.vehicle.update({
              where: {
                id:
                  vehicle.id,
              },
              data: {
                mileage:
                  dto.mileage,
              },
            });
        }

        const orderNumber =
          'SO-' +
          new Date()
            .toISOString()
            .replace(
              /\D/g,
              '',
            )
            .slice(
              0,
              14,
            ) +
          '-' +
          Math.floor(
            1000 +
              Math.random() *
                9000,
          );

        const order =
          await tx.serviceOrder.create({
            data: {
              organizationId,
              branchId:
                resolvedBranchId,
              customerId:
                customer.id,
              vehicleId:
                vehicle.id,
              orderNumber,
              mileage:
                dto.mileage,
              complaint:
                dto.customerComplaint
                  ?.trim() ||
                null,
              internalNote:
                [
                  'Mobil araç kabul ön kaydı',
                  dto.internalNote
                    ?.trim(),
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    ' · ',
                  ),
              status:
                ServiceOrderStatus.ACCEPTED,
            },
          });

        const inspection =
          await tx.inspection.create({
            data: {
              organizationId,
              branchId,
              vehicleId:
                vehicle.id,
              serviceOrderId:
                order.id,
              inspectorId:
                userId,
              mileage:
                dto.mileage,
              fuelLevel:
                dto.fuelLevel
                  ?.trim() ||
                null,
              customerComplaint:
                dto.customerComplaint
                  ?.trim() ||
                null,
              existingDamage:
                dto.existingDamage
                  ?.trim() ||
                null,
              valuablesNote:
                dto.valuablesNote
                  ?.trim() ||
                null,
            },
          });

        const plannedItems =
          dto.plannedItems ||
          [];

        for (
          const item of
            plannedItems
        ) {
          const quantity =
            Number(
              item.quantity,
            );

          const unitPrice =
            this.roundMoney(
              Number(
                item.unitPrice ||
                  0,
              ),
            );

          const totalPrice =
            this.roundMoney(
              quantity *
                unitPrice,
            );

          const vatRate =
            Number(
              item.vatRate ??
                20,
            );

          const vatAmount =
            this.roundMoney(
              totalPrice *
                (
                  vatRate /
                  100
                ),
            );

          const grossTotal =
            this.roundMoney(
              totalPrice +
                vatAmount,
            );

          await tx.serviceOrderItem.create({
            data: {
              serviceOrderId:
                order.id,
              type:
                item.type,
              name:
                item.name.trim(),
              description:
                item.description
                  ?.trim() ||
                null,
              quantity,
              unitPrice,
              discountAmount:
                0,
              totalPrice,
              vatRate,
              vatAmount,
              grossTotal,
              completed:
                false,
            },
          });

          await tx.inspectionItem.create({
            data: {
              inspectionId:
                inspection.id,
              category:
                item.category
                  ?.trim() ||
                'PLANLANAN_ISLEM',
              name:
                item.name.trim(),
              condition:
                'PLANLANDI',
              note:
                item.description
                  ?.trim() ||
                null,
              recommendedAction:
                item.type ===
                  'PART'
                  ? 'Parça / malzeme kullanılacak'
                  : 'Bakım / tamir işlemi uygulanacak',
              estimatedPrice:
                grossTotal,
            },
          });
        }

        const result =
          await tx.inspection.findUnique({
            where: {
              id:
                inspection.id,
            },
            include: {
              vehicle: {
                include: {
                  customer:
                    true,
                },
              },
              serviceOrder: {
                include: {
                  items: true,
                },
              },
              items: true,
              media: true,
              inspector: {
                select: {
                  id: true,
                  firstName:
                    true,
                  lastName:
                    true,
                },
              },
            },
          });

        return {
          customer,
          vehicle,
          inspection:
            result,
          serviceOrder:
            result?.serviceOrder,
        };
      },
    );
  }

  async create(
    organizationId: string,
    actorBranchId: string | null,
    actorRole: UserRole,
    userId: string,
    dto: CreateInspectionDto,
  ) {
    const vehicle =
      await this.prisma.vehicle.findFirst({
        where: {
          id: dto.vehicleId,
          organizationId,
        },
      });

    if (!vehicle) {
      throw new BadRequestException(
        'Araç bulunamadı.',
      );
    }

    let branchId = actorBranchId;

    if (dto.serviceOrderId) {
      const serviceOrder =
        await this.prisma.serviceOrder.findFirst({
          where: {
            id: dto.serviceOrderId,
            organizationId,
            vehicleId: dto.vehicleId,
            ...this.branchFilter(
              actorRole,
              actorBranchId,
            ),
          },
        });

      if (!serviceOrder) {
        throw new BadRequestException(
          'İş emri geçersiz veya bu iş emrine erişim yetkiniz yok.',
        );
      }

      branchId =
        serviceOrder.branchId;
    }

    if (!branchId) {
      throw new BadRequestException(
        'Şube seçimi gerekli.',
      );
    }

    const branch =
      await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          organizationId,
          active: true,
        },
      });

    if (!branch) {
      throw new BadRequestException(
        'Geçerli ve aktif bir şube gerekli.',
      );
    }

    return this.prisma.inspection.create({
      data: {
        organizationId,
        branchId,
        vehicleId: dto.vehicleId,
        serviceOrderId:
          dto.serviceOrderId,
        inspectorId: userId,
        mileage: dto.mileage,
        fuelLevel:
          dto.fuelLevel,
        customerComplaint:
          dto.customerComplaint,
        existingDamage:
          dto.existingDamage,
        valuablesNote:
          dto.valuablesNote,
      },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        serviceOrder: {
          include: {
            items: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
        media: true,
      },
    });
  }

  findAll(
    organizationId: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    return this.prisma.inspection.findMany({
      where: {
        organizationId,
        ...this.branchFilter(
          actorRole,
          actorBranchId,
        ),
      },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        serviceOrder: {
          include: {
            items: true,
          },
        },
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: true,
        media: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addItem(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorBranchId: string | null,
    dto: CreateInspectionItemDto,
  ) {
    const inspection =
      await this.prisma.inspection.findFirst({
        where: {
          id,
          organizationId,
          ...this.branchFilter(
            actorRole,
            actorBranchId,
          ),
        },
      });

    if (!inspection) {
      throw new NotFoundException(
        'Kontrol kaydı bulunamadı veya erişim yetkiniz yok.',
      );
    }

    if (
      inspection.status ===
      InspectionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Tamamlanmış araç kabul kaydına yeni kontrol maddesi eklenemez.',
      );
    }

    return this.prisma.inspectionItem.create({
      data: {
        inspectionId: id,
        category: dto.category,
        name: dto.name,
        condition:
          dto.condition,
        note: dto.note,
        recommendedAction:
          dto.recommendedAction,
      },
    });
  }

  async complete(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    const inspection =
      await this.prisma.inspection.findFirst({
        where: {
          id,
          organizationId,
          ...this.branchFilter(
            actorRole,
            actorBranchId,
          ),
        },
      });

    if (!inspection) {
      throw new NotFoundException(
        'Kontrol kaydı bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return this.prisma.inspection.update({
      where: { id },
      data: {
        status:
          InspectionStatus.COMPLETED,
      },
      include: {
        items: true,
        media: true,
      },
    });
  }
}
