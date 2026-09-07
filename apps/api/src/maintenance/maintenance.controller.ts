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

import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';

@UseGuards(AuthGuard('jwt'))
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
      dto,
    );
  }

  @Get('records')
  findRecords(
    @Req() req: any,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.maintenanceService.findRecords(
      req.user.organizationId,
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
    );
  }
}
