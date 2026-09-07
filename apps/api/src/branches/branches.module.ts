import { Module } from '@nestjs/common';

import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  controllers: [BranchesController],
  providers: [
    BranchesService,
    RolesGuard,
  ],
})
export class BranchesModule {}
