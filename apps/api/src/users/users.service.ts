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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
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

  async create(
    organizationId: string,
    actorRole: UserRole,
    dto: CreateUserDto,
  ) {
    const existing = await this.findByEmail(dto.email);

    if (existing) {
      throw new BadRequestException(
        'Bu e-posta adresi zaten kullan�l�yor.',
      );
    }
if (
  actorRole !== UserRole.OWNER &&
  (
    dto.role === UserRole.OWNER ||
    dto.role === UserRole.MANAGER
  )
) {
  throw new ForbiddenException(
    'Bu role sahip kullanıcı oluşturamazsınız.',
  );
}

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: dto.branchId,
          organizationId,
          active: true,
        },
      });

      if (!branch) {
        throw new BadRequestException(
          'Ge�erli bir �ube se�iniz.',
        );
      }
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      12,
    );

    return this.prisma.user.create({
      data: {
        organizationId,
        branchId: dto.branchId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
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

  async setActive(
    organizationId: string,
    actorId: string,
    actorRole: UserRole,
    id: string,
    active: boolean,
  ) {
    const target = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!target) {
      throw new NotFoundException(
        'Personel bulunamad�.',
      );
    }

    if (target.id === actorId && !active) {
      throw new BadRequestException(
        'Kendi hesab�n�z� pasif yapamazs�n�z.',
      );
    }

    if (
      target.role === UserRole.OWNER &&
      actorRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'OWNER hesab�n� de�i�tirme yetkiniz yok.',
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
    const target = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!target) {
      throw new NotFoundException(
        'Personel bulunamad�.',
      );
    }

    if (
      target.role === UserRole.OWNER &&
      actorRole !== UserRole.OWNER
    ) {
      throw new ForbiddenException(
        'OWNER hesab�n� de�i�tirme yetkiniz yok.',
      );
    }

    if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          organizationId,
          active: true,
        },
      });

      if (!branch) {
        throw new BadRequestException(
          '�ube bulunamad�.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        branchId: branchId ?? null,
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
}
