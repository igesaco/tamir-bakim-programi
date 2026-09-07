import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Req() req: any, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(
      req.user.organizationId,
      req.user.branchId,
      dto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Req() req: any) {
    return this.vehiclesService.findAll(req.user.organizationId);
  }

  @Get('qr/:token')
  findByQr(@Param('token') token: string) {
    return this.vehiclesService.findPublicByQr(token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.vehiclesService.findOne(
      req.user.organizationId,
      id,
    );
  }
}