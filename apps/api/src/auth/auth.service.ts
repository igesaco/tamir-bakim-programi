import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private publicRegistrationEnabled() {
    if (
      process.env.ALLOW_PUBLIC_REGISTRATION ===
      'true'
    ) {
      return true;
    }

    return process.env.NODE_ENV !== 'production';
  }

  async register(dto: RegisterDto) {
    if (!this.publicRegistrationEnabled()) {
      throw new ForbiddenException(
        'Yeni işletme kaydı şu anda kapalı.',
      );
    }

    const email = dto.email
      .trim()
      .toLowerCase();

    const existingUser =
      await this.usersService.findByEmail(
        email,
      );

    if (existingUser) {
      throw new BadRequestException(
        'Bu e-posta adresi zaten kayıtlı.',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const organization =
            await tx.organization.create({
              data: {
                name:
                  dto.organizationName.trim(),
              },
            });

          const branch =
            await tx.branch.create({
              data: {
                name:
                  dto.branchName.trim(),
                organizationId:
                  organization.id,
              },
            });

          const user =
            await tx.user.create({
              data: {
                firstName:
                  dto.firstName.trim(),
                lastName:
                  dto.lastName.trim(),
                email,
                phone:
                  dto.phone?.trim(),
                passwordHash,
                role:
                  UserRole.OWNER,
                organizationId:
                  organization.id,
                branchId:
                  branch.id,
              },
            });

          return {
            organization,
            branch,
            user,
          };
        },
      );

    const token =
      await this.createToken(
        result.user,
      );

    return {
      token,
      user: {
        id:
          result.user.id,
        firstName:
          result.user.firstName,
        lastName:
          result.user.lastName,
        email:
          result.user.email,
        role:
          result.user.role,
      },
      organization:
        result.organization,
      branch:
        result.branch,
    };
  }

  async login(dto: LoginDto) {
    const user =
      await this.usersService.findByEmail(
        dto.email,
      );

    if (!user) {
      throw new UnauthorizedException(
        'E-posta veya şifre hatalı.',
      );
    }

    const passwordCorrect =
      await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );

    if (!passwordCorrect) {
      throw new UnauthorizedException(
        'E-posta veya şifre hatalı.',
      );
    }

    if (!user.active) {
      throw new UnauthorizedException(
        'Kullanıcı hesabı aktif değil.',
      );
    }

    if (!user.organization.active) {
      throw new UnauthorizedException(
        'İşletme hesabı aktif değil.',
      );
    }

    const token =
      await this.createToken(user);

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
        role:
          user.role,
        organizationId:
          user.organizationId,
        branchId:
          user.branchId,
      },
    };
  }

  private createToken(user: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
    branchId: string | null;
    tokenVersion: number;
  }) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId:
        user.organizationId,
      branchId:
        user.branchId,
      tokenVersion:
        user.tokenVersion,
    });
  }
}
