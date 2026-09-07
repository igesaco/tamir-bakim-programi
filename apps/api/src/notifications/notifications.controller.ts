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
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard('jwt'))
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)
@UseGuards(RolesGuard)
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
      req.user.role,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.notificationsService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
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
      req.user.role,
      req.user.branchId,
    );
  }
}
