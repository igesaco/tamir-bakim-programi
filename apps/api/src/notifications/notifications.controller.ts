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
import { FeatureKey,
  UserRole,
  PermissionKey,
} from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Permission } from '../permissions/permission.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
  UserRole.TECHNICIAN,
  UserRole.WAREHOUSE,
  UserRole.ACCOUNTING,
)

@Feature(FeatureKey.NOTIFICATIONS)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

@Permission(PermissionKey.NOTIFICATION_MANAGE)
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

@Permission(PermissionKey.NOTIFICATION_VIEW)
  @Get()
  findAll(@Req() req: any) {
    return this.notificationsService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
      req.user.sub,
    );
  }

@Permission(PermissionKey.NOTIFICATION_VIEW)
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
      req.user.sub,
    );
  }
}
