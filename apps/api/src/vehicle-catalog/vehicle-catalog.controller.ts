import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { VehicleCatalogService } from './vehicle-catalog.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)
@Controller('vehicle-catalog')
export class VehicleCatalogController {
  constructor(
    private readonly vehicleCatalogService: VehicleCatalogService,
  ) {}

  @Get('makes')
  makes(@Req() _req: any) {
    return this.vehicleCatalogService.getMakes();
  }

  @Get('models')
  models(
    @Query('make') make: string,
    @Query('year') year?: string,
  ) {
    return this.vehicleCatalogService.getModels(
      make,
      year ? Number(year) : undefined,
    );
  }
}
