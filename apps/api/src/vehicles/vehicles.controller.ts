import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeatureKey,
  UserRole,
  PermissionKey,
} from '@prisma/client';

import { Permission } from '../permissions/permission.decorator';
import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Feature(FeatureKey.VEHICLES_QR)
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
  ) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
@Permission(PermissionKey.VEHICLE_CREATE)
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      dto,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
  )
@Permission(PermissionKey.VEHICLE_VIEW)
  @Get()
  findAll(@Req() req: any) {
    return this.vehiclesService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

  @Get('qr/:token')
  findByQr(
    @Param('token') token: string,
  ) {
    return this.vehiclesService.findPublicByQr(
      token,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
  )
@Permission(PermissionKey.VEHICLE_VIEW)
  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.findOne(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @Permission(PermissionKey.VEHICLE_QR)
  @Patch(':id/qr/regenerate')
  regenerateQr(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.regenerateQr(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
  )
@Permission(PermissionKey.VEHICLE_UPDATE)
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
      dto,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
@Permission(PermissionKey.VEHICLE_DELETE)
  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.remove(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }
}
