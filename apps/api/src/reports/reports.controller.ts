import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeatureKey, UserRole } from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard('jwt'))
@Feature(FeatureKey.REPORTS)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  dashboard(@Req() req: any) {
    return this.reportsService.dashboard(
      req.user.organizationId,
    );
  }
}
