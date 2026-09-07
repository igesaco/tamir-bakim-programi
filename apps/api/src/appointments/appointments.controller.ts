import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentStatus } from '@prisma/client';

import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
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
    @Body('status', new ParseEnumPipe(AppointmentStatus))
    status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(
      req.user.organizationId,
      id,
      status,
    );
  }
}
