import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UploadMediaDto } from './dto/upload-media.dto';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
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

  async create(
    organizationId: string,
    actorBranchId: string | null,
    actorRole: UserRole,
    userId: string,
    dto: UploadMediaDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Dosya gerekli.',
      );
    }

    let branchId = actorBranchId;

    if (dto.serviceOrderId) {
      const order =
        await this.prisma.serviceOrder.findFirst({
          where: {
            id: dto.serviceOrderId,
            organizationId,
            ...this.branchFilter(
              actorRole,
              actorBranchId,
            ),
          },
        });

      if (!order) {
        throw new BadRequestException(
          'İş emri bulunamadı veya erişim yetkiniz yok.',
        );
      }

      branchId = order.branchId;

      if (
        actorRole ===
          UserRole.TECHNICIAN &&
        (
          order.assignedTechnicianId !==
            userId ||
          (
            actorBranchId &&
            order.branchId !==
              actorBranchId
          )
        )
      ) {
        throw new ForbiddenException(
          'Teknik personel yalnızca kendisine atanmış iş emrine dosya ekleyebilir.',
        );
      }

      if (
        dto.vehicleId &&
        dto.vehicleId !==
          order.vehicleId
      ) {
        throw new BadRequestException(
          'Dosya için seçilen araç iş emriyle eşleşmiyor.',
        );
      }
    }

    if (dto.inspectionId) {
      const inspection =
        await this.prisma.inspection.findFirst({
          where: {
            id: dto.inspectionId,
            organizationId,
            ...this.branchFilter(
              actorRole,
              actorBranchId,
            ),
          },
        });

      if (!inspection) {
        throw new BadRequestException(
          'Kontrol kaydı bulunamadı veya erişim yetkiniz yok.',
        );
      }

      branchId =
        inspection.branchId;

      if (
        dto.serviceOrderId &&
        inspection.serviceOrderId !==
          dto.serviceOrderId
      ) {
        throw new BadRequestException(
          'Kontrol kaydı iş emriyle eşleşmiyor.',
        );
      }

      if (
        dto.vehicleId &&
        inspection.vehicleId !==
          dto.vehicleId
      ) {
        throw new BadRequestException(
          'Kontrol kaydı araçla eşleşmiyor.',
        );
      }
    }

    if (dto.vehicleId) {
      const vehicle =
        await this.prisma.vehicle.findFirst({
          where: {
            id: dto.vehicleId,
            organizationId,
            ...(actorRole ===
            UserRole.SERVICE_ADVISOR
              ? {
                  branchId:
                    actorBranchId ??
                    '__branch_not_assigned__',
                }
              : {}),
          },
        });

      if (!vehicle) {
        throw new BadRequestException(
          'Araç bulunamadı veya erişim yetkiniz yok.',
        );
      }

      branchId =
        branchId ??
        vehicle.branchId;
    }

    if (
      actorRole ===
        UserRole.SERVICE_ADVISOR &&
      branchId !== actorBranchId
    ) {
      throw new ForbiddenException(
        'Servis danışmanı yalnızca kendi şubesine dosya ekleyebilir.',
      );
    }

    return this.prisma.media.create({
      data: {
        organizationId,
        branchId,
        vehicleId:
          dto.vehicleId,
        serviceOrderId:
          dto.serviceOrderId,
        inspectionId:
          dto.inspectionId,
        uploadedById:
          userId,
        type: dto.type,
        storageKey:
          `uploads/${file.filename}`,
        fileName:
          file.originalname,
        mimeType:
          file.mimetype,
        sizeBytes:
          file.size,
        description:
          dto.description,
        customerVisible:
          dto.customerVisible ===
          'true',
      },
    });
  }

  findAll(
    organizationId: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    return this.prisma.media.findMany({
      where: {
        organizationId,
        ...this.branchFilter(
          actorRole,
          actorBranchId,
        ),
      },
      include: {
        vehicle: true,
        serviceOrder: true,
        inspection: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    organizationId: string,
    id: string,
    actorRole: UserRole,
    actorBranchId: string | null,
  ) {
    const media =
      await this.prisma.media.findFirst({
        where: {
          id,
          organizationId,
          ...this.branchFilter(
            actorRole,
            actorBranchId,
          ),
        },
      });

    if (!media) {
      throw new NotFoundException(
        'Dosya bulunamadı veya erişim yetkiniz yok.',
      );
    }

    return media;
  }
}
