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
import { ImportCustomerRowDto } from './dto/import-customers.dto';
import { atomic } from '../workflow/transaction';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private cleanPhone(
    phone?: string,
  ) {
    if (
      phone === undefined
    ) {
      return undefined;
    }

    const digits =
      phone.replace(
        /\D/g,
        '',
      );

    return digits || null;
  }

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
          this.cleanPhone(
            dto.phone,
          ),
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

  async previewImport(
    organizationId: string,
    actorBranchId: string | null,
    role: UserRole,
    rows: ImportCustomerRowDto[],
  ) {
    if (!rows.length || rows.length > 500) {
      throw new BadRequestException('İçe aktarma 1 ile 500 satır arasında olmalıdır.');
    }
    const phones = rows.map(row => this.cleanPhone(row.phone)).filter(Boolean) as string[];
    const emails = rows.map(row => row.email?.trim().toLowerCase()).filter(Boolean) as string[];
    const plates = rows.map(row => row.plate?.replace(/\s+/g, '').toLocaleUpperCase('tr-TR')).filter(Boolean) as string[];
    const [existingCustomers, existingVehicles] = await Promise.all([
      this.prisma.customer.findMany({
        where: { organizationId, OR: [{ phone: { in: phones } }, { email: { in: emails } }] },
        select: { phone: true, email: true },
      }),
      this.prisma.vehicle.findMany({ where: { organizationId, plate: { in: plates } }, select: { plate: true } }),
    ]);
    const seen = new Set<string>();
    const results = rows.map((row, index) => {
      const errors: string[] = [];
      const branchId = role === UserRole.OWNER || role === UserRole.MANAGER
        ? row.branchId || actorBranchId : actorBranchId;
      const phone = this.cleanPhone(row.phone);
      const email = row.email?.trim().toLowerCase();
      const plate = row.plate?.replace(/\s+/g, '').toLocaleUpperCase('tr-TR');
      if (!branchId) errors.push('Şube eksik');
      if (phone && (seen.has(`p:${phone}`) || existingCustomers.some(item => item.phone === phone))) errors.push('Telefon zaten kayıtlı');
      if (email && (seen.has(`e:${email}`) || existingCustomers.some(item => item.email === email))) errors.push('E-posta zaten kayıtlı');
      if (plate && (seen.has(`v:${plate}`) || existingVehicles.some(item => item.plate === plate))) errors.push('Plaka zaten kayıtlı');
      if (plate && (!row.brand?.trim() || !row.model?.trim())) errors.push('Araç için marka ve model gerekli');
      if (phone) seen.add(`p:${phone}`);
      if (email) seen.add(`e:${email}`);
      if (plate) seen.add(`v:${plate}`);
      return { index, valid: errors.length === 0, errors, normalized: { ...row, branchId, phone, email, plate } };
    });
    return { total: rows.length, valid: results.filter(row => row.valid).length, invalid: results.filter(row => !row.valid).length, rows: results };
  }

  async commitImport(
    organizationId: string,
    actorBranchId: string | null,
    role: UserRole,
    rows: ImportCustomerRowDto[],
  ) {
    const preview = await this.previewImport(organizationId, actorBranchId, role, rows);
    if (preview.invalid) {
      throw new BadRequestException('Hatalı satırlar düzeltilmeden içe aktarma yapılamaz.');
    }
    return atomic(this.prisma, organizationId, async tx => {
      const created = [];
      for (const result of preview.rows) {
        const row = result.normalized;
        const branchId = row.branchId;
        if (!branchId) throw new BadRequestException(`${result.index + 1}. satırda şube eksik.`);
        const branch = await tx.branch.findFirst({ where: { id: branchId, organizationId, active: true } });
        if (!branch) throw new BadRequestException(`${result.index + 1}. satırdaki şube aktif değil.`);
        const customer = await tx.customer.create({
          data: {
            organizationId, branchId, firstName: row.firstName.trim(),
            lastName: row.lastName?.trim(), phone: row.phone, email: row.email,
            address: row.address?.trim(),
          },
        });
        if (row.plate) {
          await tx.vehicle.create({
            data: {
              organizationId, branchId, customerId: customer.id,
              plate: row.plate, brand: row.brand!.trim(), model: row.model!.trim(),
              modelYear: row.modelYear, mileage: row.mileage ?? 0,
            },
          });
        }
        created.push(customer.id);
      }
      return { imported: created.length, customerIds: created };
    });
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
          vehicles: {
            include: {
              media: {
                where: {
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
                orderBy: {
                  createdAt: 'desc',
                },
                take: 12,
              },
              serviceOrders: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  mileage: true,
                  complaint: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 5,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
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
                this.cleanPhone(
                  dto.phone,
                ),
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
