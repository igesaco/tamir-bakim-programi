import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const PANEL_USER_ROLES =
  new Set<UserRole>([
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
    UserRole.WAREHOUSE,
    UserRole.ACCOUNTING,
  ]);

const BRANCH_REQUIRED_ROLES =
  new Set<UserRole>([
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
    UserRole.WAREHOUSE,
    UserRole.ACCOUNTING,
  ]);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private normalizeEmail(email: string) {
    return email
      .trim()
      .toLowerCase();
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email:
          this.normalizeEmail(email),
      },
      include: {
        organization: true,
        branch: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        branch: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        branch: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findTechnicians(
    organizationId: string,
    requesterRole: UserRole,
    branchId: string | null,
  ) {
    if (
      requesterRole ===
        UserRole.SERVICE_ADVISOR &&
      !branchId
    ) {
      throw new BadRequestException(
        'Servis danışmanı için şube ataması gerekli.',
      );
    }

    return this.prisma.user.findMany({
      where: {
        organizationId,
        role: UserRole.TECHNICIAN,
        active: true,
        ...(requesterRole ===
        UserRole.SERVICE_ADVISOR
          ? { branchId }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });
  }

  async create(
    organizationId: string,
    actorRole: UserRole,
    dto: CreateUserDto,
  ) {
    const email =
      this.normalizeEmail(dto.email);

    const existing =
      await this.findByEmail(email);

    if (existing) {
      throw new BadRequestException(
        'Bu e-posta adresi zaten kullanılıyor.',
      );
    }

    if (
      dto.role === UserRole.OWNER &&
      actorRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'Kurucu rolüne sahip kullanıcı oluşturamazsınız.',
      );
    }

    if (
      !PANEL_USER_ROLES.has(dto.role)
    ) {
      throw new BadRequestException(
        'Bu kullanıcı rolü bu panelde desteklenmiyor.',
      );
    }

    if (
      BRANCH_REQUIRED_ROLES.has(
        dto.role,
      ) &&
      !dto.branchId
    ) {
      throw new BadRequestException(
        'Yönetici, servis danışmanı, teknisyen, depo ve muhasebe personeli için şube seçimi zorunludur.',
      );
    }

    if (dto.branchId) {
      const branch =
        await this.prisma.branch.findFirst({
          where: {
            id: dto.branchId,
            organizationId,
            active: true,
          },
        });

      if (!branch) {
        throw new BadRequestException(
          'Geçerli bir şube seçiniz.',
        );
      }
    }

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    return this.prisma.user.create({
      data: {
        organizationId,
        branchId:
          dto.branchId,
        firstName:
          dto.firstName.trim(),
        lastName:
          dto.lastName.trim(),
        email,
        phone:
          dto.phone?.trim(),
        passwordHash,
        role:
          dto.role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        branchId: true,
        branch: true,
        createdAt: true,
      },
    });
  }

  async changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: { id: userId },
      });

    if (!user) {
      throw new NotFoundException(
        'Kullanıcı bulunamadı.',
      );
    }

    const correct =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

    if (!correct) {
      throw new BadRequestException(
        'Mevcut şifre yanlış.',
      );
    }

    if (
      await bcrypt.compare(
        newPassword,
        user.passwordHash,
      )
    ) {
      throw new BadRequestException(
        'Yeni şifre mevcut şifrenizle aynı olamaz.',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12,
      );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      message:
        'Şifreniz güncellendi. Diğer oturumlar sonlandırıldı.',
    };
  }

  async resetPassword(
    organizationId: string,
    actorRole: UserRole,
    id: string,
    password: string,
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!target) {
      throw new NotFoundException(
        'Personel bulunamadı.',
      );
    }

    if (
      target.role === UserRole.OWNER &&
      actorRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'Kurucu hesabının şifresini yalnızca kurucu değiştirebilir.',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        tokenVersion: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      message:
        'Personel şifresi yenilendi ve eski oturumları sonlandırıldı.',
    };
  }

  async setActive(
    organizationId: string,
    actorId: string,
    actorRole: UserRole,
    id: string,
    active: boolean,
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!target) {
      throw new NotFoundException(
        'Personel bulunamadı.',
      );
    }

    if (
      target.id === actorId &&
      !active
    ) {
      throw new BadRequestException(
        'Kendi hesabınızı pasif yapamazsınız.',
      );
    }

    if (
      target.role === UserRole.OWNER &&
      actorRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'Kurucu hesabını değiştirme yetkiniz yok.',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { active },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        active: true,
      },
    });
  }

  async changeBranch(
    organizationId: string,
    actorRole: UserRole,
    id: string,
    branchId?: string,
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!target) {
      throw new NotFoundException(
        'Personel bulunamadı.',
      );
    }

    if (
      target.role === UserRole.OWNER &&
      actorRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'Kurucu hesabını değiştirme yetkiniz yok.',
      );
    }

    if (
      BRANCH_REQUIRED_ROLES.has(
        target.role,
      ) &&
      !branchId
    ) {
      throw new BadRequestException(
        'Bu personel rolü için şube seçimi zorunludur.',
      );
    }

    if (branchId) {
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
          'Şube bulunamadı.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        branchId:
          branchId ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        branchId: true,
        branch: true,
      },
    });
  }

  async changeRole(
    organizationId: string,
    actorId: string,
    actorRole: UserRole,
    id: string,
    role: UserRole,
  ) {
    const target =
      await this.prisma.user.findFirst({
        where: {
          id,
          organizationId,
        },
      });

    if (!target) {
      throw new NotFoundException(
        'Personel bulunamadı.',
      );
    }

    if (
      id === actorId &&
      role !== target.role
    ) {
      throw new BadRequestException(
        'Kendi rolünüzü değiştiremezsiniz.',
      );
    }

    if (
      (target.role === UserRole.OWNER ||
        role === UserRole.OWNER) &&
      actorRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'Kurucu rolünü yalnızca kurucu yönetebilir.',
      );
    }

    if (
      !PANEL_USER_ROLES.has(role)
    ) {
      throw new BadRequestException(
        'Bu rol bu panelde desteklenmiyor.',
      );
    }

    if (
      BRANCH_REQUIRED_ROLES.has(
        role,
      ) &&
      !target.branchId
    ) {
      throw new BadRequestException(
        'Bu role geçiş için önce personele şube atayın.',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        active: true,
        branchId: true,
        branch: true,
      },
    });
  }
}
