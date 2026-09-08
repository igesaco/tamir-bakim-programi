import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeatureKey, UserRole } from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateMaintenancePackageDto } from './dto/create-maintenance-package.dto';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { MaintenanceService } from './maintenance.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)

@Feature(FeatureKey.MAINTENANCE)
@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @Post('records')
  createRecord(
    @Req() req: any,
    @Body() dto: CreateMaintenanceRecordDto,
  ) {
    return this.maintenanceService.createRecord(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      dto,
    );
  }

  @Post('plans')
  createPlan(
    @Req() req: any,
    @Body() dto: CreateMaintenancePlanDto,
  ) {
    return this.maintenanceService.createPlan(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      dto,
    );
  }

  @Get('alerts')
  alerts(@Req() req: any) {
    return this.maintenanceService.alerts(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

  @Get('records')
  findRecords(
    @Req() req: any,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.maintenanceService.findRecords(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
      vehicleId,
    );
  }

  @Get('plans')
  findPlans(
    @Req() req: any,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.maintenanceService.findPlans(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
      vehicleId,
    );
  }

  @Patch('plans/:id/complete')
  completePlan(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.maintenanceService.completePlan(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }

  @Get('packages')
  findPackages(@Req() req: any) {
    return this.maintenanceService.findPackages(
      req.user.organizationId,
    );
  }

  @Post('packages')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  createPackage(
    @Req() req: any,
    @Body() dto: CreateMaintenancePackageDto,
  ) {
    return this.maintenanceService.createPackage(
      req.user.organizationId,
      dto,
    );
  }

  @Patch('packages/:id/active')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  setPackageActive(
    @Req() req: any,
    @Param('id') id: string,
    @Body('active') active: boolean,
  ) {
    return this.maintenanceService.setPackageActive(
      req.user.organizationId,
      id,
      active,
    );
  }
}
