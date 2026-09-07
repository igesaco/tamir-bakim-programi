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
} from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@UseGuards(AuthGuard('jwt'))
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)
@UseGuards(RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.sub,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.appointmentsService.findAll(
      req.user.organizationId,
    );
  }

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
    );
  }
}
