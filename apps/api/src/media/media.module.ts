import { MediaContentController } from './media-content.controller';
import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  providers: [
    MediaService,
    RolesGuard,
  ],
  controllers: [MediaController, MediaContentController],
})
export class MediaModule {}
