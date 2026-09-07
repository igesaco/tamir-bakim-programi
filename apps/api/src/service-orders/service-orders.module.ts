import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';

@Module({
  providers: [
    ServiceOrdersService,
    RolesGuard,
  ],
  controllers: [ServiceOrdersController],
})
export class ServiceOrdersModule {}
