import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const unique =
            Date.now() + '-' + Math.round(Math.random() * 1e9);

          callback(
            null,
            unique + extname(file.originalname),
          );
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  upload(
    @Req() req: any,
    @Body() dto: UploadMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.sub,
      dto,
      file,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.mediaService.findAll(
      req.user.organizationId,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.mediaService.findOne(
      req.user.organizationId,
      id,
    );
  }
}
