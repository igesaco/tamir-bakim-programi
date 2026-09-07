import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  providers: [
    MaintenanceService,
    RolesGuard,
  ],
  controllers: [MaintenanceController],
})
export class MaintenanceModule {}
