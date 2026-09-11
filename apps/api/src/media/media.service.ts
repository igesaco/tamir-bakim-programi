import { readFile, unlink } from 'fs/promises';
import { basename, resolve } from 'path';
import { Readable } from 'stream';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyMediaLink } from './media-links';
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

  private objectStore() {
    if (!process.env.MEDIA_S3_BUCKET) return null;
    if (!process.env.MEDIA_S3_ENDPOINT || !process.env.MEDIA_S3_ACCESS_KEY_ID || !process.env.MEDIA_S3_SECRET_ACCESS_KEY)
      throw new Error('Medya nesne depolama yapılandırması eksik.');
    return new S3Client({ endpoint: process.env.MEDIA_S3_ENDPOINT, region: process.env.MEDIA_S3_REGION || 'auto',
      credentials: { accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID, secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY } });
  }

  async readContent(id: string, access: string) {
    const claim = verifyMediaLink(id, access);
    const media = await this.prisma.media.findFirst({ where: { id, organizationId: claim.org },
      include: { serviceOrder: true, vehicle: true, object: { select: { data: true } } } });
    if (!media) throw new NotFoundException('Dosya bulunamadı.');
    if (claim.customer) {
      const customer = await this.prisma.customer.findFirst({ where: { id: claim.customer, organizationId: claim.org, portalEnabled: true, organization: { active: true } } });
      if (!customer || !media.customerVisible || media.vehicle?.customerId !== customer.id || ['DOCUMENT','INVOICE'].includes(media.type))
        throw new ForbiddenException('Dosyaya erişiminiz yok.');
    } else {
      const user = await this.prisma.user.findFirst({ where: { id: claim.user || '__none__', organizationId: claim.org, active: true, organization: { active: true } } });
      if (!user || user.role !== claim.role || Number(claim.version ?? -1) !== user.tokenVersion)
        throw new ForbiddenException('Dosya erişim oturumu geçersiz.');
      if (user.role === UserRole.TECHNICIAN && (media.serviceOrder?.assignedTechnicianId !== user.id || (user.branchId && media.branchId !== user.branchId)))
        throw new ForbiddenException('Dosya size atanmış bir işe ait değil.');
      if (user.role === UserRole.SERVICE_ADVISOR && media.branchId !== user.branchId) throw new ForbiddenException('Dosya başka şubeye ait.');
    }
    if (media.storageKey.startsWith('s3/')) {
      const s3 = this.objectStore();
      if (!s3) throw new NotFoundException('Dosya depolama bağlantısı hazır değil.');
      const result = await s3.send(new GetObjectCommand({ Bucket: process.env.MEDIA_S3_BUCKET, Key: media.storageKey.slice(3) }));
      return { body: result.Body as Readable, mimeType: media.mimeType };
    }
    if (media.storageKey.startsWith('db/')) {
      if (!media.object?.data) throw new NotFoundException('Dosya depoda bulunamadı.');
      return { body: Buffer.from(media.object.data), mimeType: media.mimeType };
    }
    const path = resolve(process.env.MEDIA_STORAGE_DIR || './uploads', basename(media.storageKey));
    // Opening first surfaces a missing file as a normal 404 before headers are sent.
    const data = await readFile(path).catch(() => { throw new NotFoundException('Dosya depoda bulunamadı.'); });
    return { body: data, mimeType: media.mimeType };
  }

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
    dto = { ...dto };
    if (actorRole === UserRole.TECHNICIAN && !dto.serviceOrderId) throw new ForbiddenException('Teknik personel için iş emri gerekli.');

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
      if (!dto.vehicleId || dto.vehicleId === 'undefined') dto.vehicleId = order.vehicleId;

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

    if (dto.requestKey) {
      const previous = await this.prisma.media.findUnique({ where: { organizationId_requestKey: { organizationId, requestKey: dto.requestKey } } });
      if (previous) {
        await unlink(file.path).catch(() => undefined);
        if (previous.serviceOrderId !== (dto.serviceOrderId || null) || previous.uploadedById !== userId || previous.type !== dto.type)
          throw new BadRequestException('Dosya tekrar anahtarı başka bir kayıt için kullanılmış.');
        return previous;
      }
    }
    let storageKey = `db/${organizationId}/${file.filename}`;
    let databaseObject: Uint8Array<ArrayBuffer> | undefined;
    const s3 = this.objectStore();
    if (s3) {
      storageKey = `s3/${organizationId}/${file.filename}`;
      await s3.send(new PutObjectCommand({ Bucket: process.env.MEDIA_S3_BUCKET, Key: storageKey.slice(3),
        Body: await readFile(file.path), ContentType: file.mimetype }));
      await unlink(file.path);
    } else {
      databaseObject = new Uint8Array(
        await readFile(file.path),
      );
    }
    const created = await this.prisma.media.create({
      data: {
        organizationId,
        requestKey: dto.requestKey,
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
          storageKey,
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
        object: databaseObject
          ? { create: { data: databaseObject } }
          : undefined,
      },
    });
    if (databaseObject) await unlink(file.path).catch(() => undefined);
    return created;
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
