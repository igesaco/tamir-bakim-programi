import { CompletePlanDto } from './dto/complete-plan.dto';
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
import { FeatureKey,
  UserRole,
  PermissionKey,
} from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Permission } from '../permissions/permission.decorator';
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

@Permission(PermissionKey.MAINTENANCE_MANAGE)
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

@Permission(PermissionKey.MAINTENANCE_MANAGE)
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

@Permission(PermissionKey.MAINTENANCE_VIEW)
  @Get('alerts')
  alerts(@Req() req: any) {
    return this.maintenanceService.alerts(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

@Permission(PermissionKey.MAINTENANCE_VIEW)
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

@Permission(PermissionKey.MAINTENANCE_VIEW)
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

@Permission(PermissionKey.MAINTENANCE_MANAGE)
  @Patch('plans/:id/complete')
  completePlan(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CompletePlanDto,
  ) {
    return this.maintenanceService.completePlan(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
      dto,
    );
  }

@Permission(PermissionKey.MAINTENANCE_VIEW)
  @Get('packages')
  findPackages(@Req() req: any) {
    return this.maintenanceService.findPackages(
      req.user.organizationId,
    );
  }

@Permission(PermissionKey.MAINTENANCE_MANAGE)
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

@Permission(PermissionKey.MAINTENANCE_MANAGE)
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
