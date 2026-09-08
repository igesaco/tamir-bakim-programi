import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { nationalIdFingerprint } from './customer-identity';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private accessWhere(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
  ) {
    return {
      organizationId,
      ...(role ===
      UserRole.SERVICE_ADVISOR
        ? {
            branchId:
              branchId ??
              '__branch_not_assigned__',
          }
        : {}),
    };
  }

  private safeCustomer<T extends {
    nationalIdHash?: string | null;
  }>(
    customer: T,
  ) {
    const {
      nationalIdHash:
        _nationalIdHash,
      ...safe
    } = customer;

    return safe;
  }

  private async validateBranch(
    organizationId: string,
    branchId: string,
  ) {
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
        'Geçerli ve aktif bir şube seçiniz.',
      );
    }

    return branch;
  }

  async create(
    organizationId: string,
    actorBranchId: string | null,
    role: UserRole,
    dto: CreateCustomerDto,
  ) {
    let branchId =
      actorBranchId;

    if (
      role === UserRole.OWNER ||
      role === UserRole.MANAGER
    ) {
      branchId =
        dto.branchId ??
        actorBranchId;
    } else if (
      dto.branchId &&
      dto.branchId !==
        actorBranchId
    ) {
      throw new ForbiddenException(
        'Servis danışmanı yalnızca kendi şubesine müşteri ekleyebilir.',
      );
    }

    if (!branchId) {
      throw new BadRequestException(
        'Müşteri için şube seçimi gerekli.',
      );
    }

    await this.validateBranch(
      organizationId,
      branchId,
    );

    const nationalId =
      dto.nationalId?.trim()
        ? nationalIdFingerprint(
            dto.nationalId,
          )
        : null;

    const created =
      await this.prisma.customer.create({
      data: {
        firstName:
          dto.firstName.trim(),
        lastName:
          dto.lastName?.trim(),
        phone:
          dto.phone?.trim(),
        email:
          dto.email
            ?.trim()
            .toLowerCase(),
        taxNumber:
          dto.taxNumber?.trim(),
        nationalIdHash:
          nationalId?.hash,
        nationalIdLast4:
          nationalId?.last4,
        address:
          dto.address,
        notes:
          dto.notes,
        organizationId,
        branchId,
      },
      include: {
        branch: true,
        vehicles: true,
      },
    });

    return this.safeCustomer(
      created,
    );
  }

  async findAll(
    organizationId: string,
    role: UserRole,
    branchId: string | null,
  ) {
    const customers =
      await this.prisma.customer.findMany({
      where: this.accessWhere(
        organizationId,
        role,
        branchId,
      ),
      include: {
        branch: true,
        vehicles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return customers.map(
      (customer) =>
        this.safeCustomer(
          customer,
        ),
    );
  }

  async findOne(
    organizationId: string,
    id: string,
    role: UserRole,
    branchId: string | null,
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id,
          ...this.accessWhere(
            organizationId,
            role,
            branchId,
          ),
        },
        include: {
          branch: true,
          vehicles: true,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Müşteri bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return this.safeCustomer(
      customer,
    );
  }

  async update(
    organizationId: string,
    id: string,
    role: UserRole,
    actorBranchId: string | null,
    dto: UpdateCustomerDto,
  ) {
    const customer =
      await this.findOne(
        organizationId,
        id,
        role,
        actorBranchId,
      );

    let targetBranchId =
      customer.branchId;

    let nationalIdHash:
      | string
      | null
      | undefined;

    let nationalIdLast4:
      | string
      | null
      | undefined;

    if (
      dto.nationalId !==
      undefined
    ) {
      if (
        dto.nationalId.trim()
      ) {
        const fingerprint =
          nationalIdFingerprint(
            dto.nationalId,
          );

        nationalIdHash =
          fingerprint.hash;
        nationalIdLast4 =
          fingerprint.last4;
      } else {
        nationalIdHash = null;
        nationalIdLast4 = null;
      }
    }

    if (dto.branchId) {
      if (
        role ===
          UserRole.SERVICE_ADVISOR &&
        dto.branchId !==
          actorBranchId
      ) {
        throw new ForbiddenException(
          'Servis danışmanı müşteri şubesini değiştiremez.',
        );
      }

      await this.validateBranch(
        organizationId,
        dto.branchId,
      );

      targetBranchId =
        dto.branchId;
    }

    return this.prisma.$transaction(
      async (tx) => {
        const updated =
          await tx.customer.update({
            where: { id },
            data: {
              branchId:
                targetBranchId,
              firstName:
                dto.firstName,
              lastName:
                dto.lastName,
              phone:
                dto.phone,
              email:
                dto.email
                  ?.trim()
                  .toLowerCase(),
              taxNumber:
                dto.taxNumber,
              nationalIdHash,
              nationalIdLast4,
              address:
                dto.address,
              notes:
                dto.notes,
            },
            include: {
              branch: true,
              vehicles: true,
            },
          });

        if (
          dto.branchId &&
          dto.branchId !==
            customer.branchId
        ) {
          await tx.vehicle.updateMany({
            where: {
              organizationId,
              customerId: id,
            },
            data: {
              branchId:
                dto.branchId,
            },
          });
        }

        return this.safeCustomer(
          updated,
        );
      },
    );
  }

  async remove(
    organizationId: string,
    id: string,
    role: UserRole,
    branchId: string | null,
  ) {
    await this.findOne(
      organizationId,
      id,
      role,
      branchId,
    );

    const [
      vehicleCount,
      appointmentCount,
      serviceOrderCount,
      quoteCount,
      paymentCount,
    ] = await Promise.all([
      this.prisma.vehicle.count({
        where: { customerId: id },
      }),
      this.prisma.appointment.count({
        where: { customerId: id },
      }),
      this.prisma.serviceOrder.count({
        where: { customerId: id },
      }),
      this.prisma.quote.count({
        where: { customerId: id },
      }),
      this.prisma.payment.count({
        where: { customerId: id },
      }),
    ]);

    const dependencyCount =
      vehicleCount +
      appointmentCount +
      serviceOrderCount +
      quoteCount +
      paymentCount;

    if (dependencyCount > 0) {
      throw new BadRequestException(
        'Bu müşteriye bağlı araç veya servis kayıtları bulunduğu için müşteri silinemez.',
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Müşteri silindi.',
    };
  }
}
