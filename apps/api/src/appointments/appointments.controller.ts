import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  AppointmentStatus,
  UserRole,
  FeatureKey,
  PermissionKey,
} from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Permission } from '../permissions/permission.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)

@Feature(FeatureKey.APPOINTMENTS)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

@Permission(PermissionKey.APPOINTMENT_MANAGE)
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      req.user.sub,
      dto,
    );
  }

@Permission(PermissionKey.APPOINTMENT_VIEW)
  @Get()
  findAll(@Req() req: any) {
    return this.appointmentsService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

@Permission(PermissionKey.APPOINTMENT_MANAGE)
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body(
      'status',
      new ParseEnumPipe(AppointmentStatus),
    )
    status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(
      req.user.organizationId,
      id,
      status,
      req.user.role,
      req.user.branchId,
    );
  }
}
