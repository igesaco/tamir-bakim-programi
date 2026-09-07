import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(
      req.user.organizationId,
      req.user.branchId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.notificationsService.findAll(
      req.user.organizationId,
    );
  }

  @Patch(':id/read')
  markRead(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(
      req.user.organizationId,
      id,
    );
  }
}
