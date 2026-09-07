import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, RolesGuard],
})
export class VehiclesModule {}
