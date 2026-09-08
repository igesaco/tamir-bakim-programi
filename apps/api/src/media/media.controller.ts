import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeatureKey,
  UserRole,
  PermissionKey,
} from '@prisma/client';
import { diskStorage } from 'multer';
import {
  extname,
  resolve,
} from 'path';

import { Feature } from '../entitlements/feature.decorator';
import { Permission } from '../permissions/permission.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';

const mediaStorageDir =
  resolve(
    process.env.MEDIA_STORAGE_DIR ??
      './uploads',
  );

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
  UserRole.TECHNICIAN,
)

@Feature(FeatureKey.MEDIA)
@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
  ) {}

@Permission(PermissionKey.MEDIA_UPLOAD)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination:
          mediaStorageDir,
        filename: (
          _req,
          file,
          callback,
        ) => {
          const unique =
            Date.now() +
            '-' +
            Math.round(
              Math.random() *
                1e9,
            );

          callback(
            null,
            unique +
              extname(
                file.originalname,
              ),
          );
        },
      }),
      limits: {
        fileSize:
          15 *
          1024 *
          1024,
      },
      fileFilter: (
        _req,
        file,
        callback,
      ) => {
        const mimeTypes =
          new Set([
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/heic',
            'image/heif',
            'application/pdf',
          ]);

        const extensions =
          new Set([
            '.jpg',
            '.jpeg',
            '.png',
            '.webp',
            '.gif',
            '.heic',
            '.heif',
            '.pdf',
          ]);

        const extension =
          extname(
            file.originalname,
          ).toLowerCase();

        const allowed =
          mimeTypes.has(
            file.mimetype,
          ) &&
          extensions.has(
            extension,
          );

        if (!allowed) {
          return callback(
            new BadRequestException(
              'Yalnızca JPG, PNG, WEBP, GIF, HEIC/HEIF veya PDF dosyası yüklenebilir.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  upload(
    @Req() req: any,
    @Body() dto: UploadMediaDto,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.mediaService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      req.user.sub,
      dto,
      file,
    );
  }

@Permission(PermissionKey.MEDIA_VIEW)
  @Get()
  findAll(@Req() req: any) {
    return this.mediaService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

@Permission(PermissionKey.MEDIA_VIEW)
  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.mediaService.findOne(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }
}
