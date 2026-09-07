import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  providers: [
    ReportsService,
    RolesGuard,
  ],
  controllers: [ReportsController],
})
export class ReportsModule {}
