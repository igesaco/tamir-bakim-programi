import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

@Module({
  controllers: [InspectionsController],
  providers: [InspectionsService, RolesGuard],
})
export class InspectionsModule {}
