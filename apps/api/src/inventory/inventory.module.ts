import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  providers: [
    InventoryService,
    RolesGuard,
  ],
  controllers: [InventoryController],
})
export class InventoryModule {}
