import { Controller, Get, Header, Param, Query, StreamableFile } from '@nestjs/common';
import { MediaService } from './media.service';

// This route authorizes the short-lived media capability AND its current owner
// in the service; the storage key itself is never a public download route.
@Controller('media/content')
export class MediaContentController {
  constructor(private readonly media: MediaService) {}
  @Get(':id')
  @Header('Cache-Control', 'private, no-store')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async content(@Param('id') id: string, @Query('access') access = '') {
    const file = await this.media.readContent(id, access);
    const options = { type: file.mimeType || 'application/octet-stream', disposition: 'inline' };
    return Buffer.isBuffer(file.body) ? new StreamableFile(file.body, options) : new StreamableFile(file.body, options);
  }
}
