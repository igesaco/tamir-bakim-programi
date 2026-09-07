import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  providers: [
    BillingService,
    RolesGuard,
  ],
  controllers: [BillingController],
})
export class BillingModule {}
