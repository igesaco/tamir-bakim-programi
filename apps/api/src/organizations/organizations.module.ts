import { Module } from '@nestjs/common';

import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    RolesGuard,
  ],
})
export class OrganizationsModule {}
