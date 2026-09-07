import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  providers: [
    SuppliersService,
    RolesGuard,
  ],
  controllers: [SuppliersController],
})
export class SuppliersModule {}
