import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { VehicleCatalogController } from './vehicle-catalog.controller';
import { VehicleCatalogService } from './vehicle-catalog.service';

@Module({
  controllers: [
    VehicleCatalogController,
  ],
  providers: [
    VehicleCatalogService,
    RolesGuard,
  ],
})
export class VehicleCatalogModule {}
