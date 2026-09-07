import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, RolesGuard],
})
export class AppointmentsModule {}
