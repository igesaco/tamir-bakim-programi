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
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

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
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(
      req.user.organizationId,
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
  @Get()
  findAll(@Req() req: any) {
    return this.vehiclesService.findAll(
      req.user.organizationId,
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
  )
  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.findOne(
      req.user.organizationId,
      id,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(
      req.user.organizationId,
      id,
      dto,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.vehiclesService.remove(
      req.user.organizationId,
      id,
    );
  }
}
