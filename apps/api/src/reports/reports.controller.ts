import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  FeatureKey,
  UserRole,
  PermissionKey,
} from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Permission } from '../permissions/permission.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Feature(FeatureKey.REPORTS)
@Controller('reports')
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.ACCOUNTING,
)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Permission(PermissionKey.REPORTS_VIEW)
  @Get('dashboard')
  dashboard(@Req() req: any) {
    return this.reportsService.dashboard(
      req.user.organizationId,
    );
  }

  @Permission(PermissionKey.REPORTS_VIEW)
  @Get('revenue')
  revenue(
    @Req() req: any,
    @Query('months') months?: string,
  ) {
    return this.reportsService.revenue(
      req.user.organizationId,
      months ? parseInt(months, 10) : 12,
    );
  }

  @Permission(PermissionKey.REPORTS_VIEW)
  @Get('technician-performance')
  technicianPerformance(@Req() req: any) {
    return this.reportsService.technicianPerformance(
      req.user.organizationId,
    );
  }

  @Permission(PermissionKey.REPORTS_VIEW)
  @Get('popular-services')
  popularServices(
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.popularServices(
      req.user.organizationId,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Permission(PermissionKey.REPORTS_VIEW)
  @Get('vehicle-stats')
  vehicleStats(@Req() req: any) {
    return this.reportsService.vehicleStats(
      req.user.organizationId,
    );
  }

  @Permission(PermissionKey.REPORTS_VIEW)
  @Get('payment-methods')
  paymentMethods(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.paymentMethods(
      req.user.organizationId,
      from,
      to,
    );
  }
}
