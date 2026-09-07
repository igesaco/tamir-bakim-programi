import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadMediaDto } from './dto/upload-media.dto';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    branchId: string | null,
    userId: string,
    dto: UploadMediaDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Dosya gerekli.');
    }

    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: dto.vehicleId,
          organizationId,
        },
      });

      if (!vehicle) {
        throw new BadRequestException('Araç bulunamadý.');
      }
    }

    if (dto.serviceOrderId) {
      const order = await this.prisma.serviceOrder.findFirst({
        where: {
          id: dto.serviceOrderId,
          organizationId,
        },
      });

      if (!order) {
        throw new BadRequestException('Ýþ emri bulunamadý.');
      }
    }

    if (dto.inspectionId) {
      const inspection = await this.prisma.inspection.findFirst({
        where: {
          id: dto.inspectionId,
          organizationId,
        },
      });

      if (!inspection) {
        throw new BadRequestException('Kontrol kaydý bulunamadý.');
      }
    }

    return this.prisma.media.create({
      data: {
        organizationId,
        branchId,
        vehicleId: dto.vehicleId,
        serviceOrderId: dto.serviceOrderId,
        inspectionId: dto.inspectionId,
        uploadedById: userId,
        type: dto.type,
        storageKey: file.path.replace(/\\/g, '/'),
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        description: dto.description,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.media.findMany({
      where: {
        organizationId,
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

  async findOne(organizationId: string, id: string) {
    const media = await this.prisma.media.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!media) {
      throw new NotFoundException('Dosya bulunamadý.');
    }

    return media;
  }
}
