import {
  Body,
  Controller,
  Get,
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
import { CreatePartDto } from './dto/create-part.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { InventoryService } from './inventory.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Feature(FeatureKey.INVENTORY)
@Controller('inventory')
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.WAREHOUSE,
)

export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

@Permission(PermissionKey.INVENTORY_MANAGE)
  @Post('parts')
  createPart(
    @Req() req: any,
    @Body() dto: CreatePartDto,
  ) {
    return this.inventoryService.createPart(
      req.user.organizationId,
      dto,
    );
  }

@Permission(PermissionKey.INVENTORY_VIEW)
  @Get('parts')
  findParts(@Req() req: any) {
    return this.inventoryService.findParts(
      req.user.organizationId,
    );
  }

@Permission(PermissionKey.INVENTORY_VIEW)
  @Get('stock')
  findStock(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.findStock(
      req.user.organizationId,
      branchId ??
        req.user.branchId,
    );
  }

@Permission(PermissionKey.INVENTORY_VIEW)
  @Get('low-stock')
  findLowStock(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.findLowStock(
      req.user.organizationId,
      branchId ??
        req.user.branchId,
    );
  }

@Permission(PermissionKey.INVENTORY_MANAGE)
  @Post('in')
  stockIn(
    @Req() req: any,
    @Body() dto: StockMovementDto,
  ) {
    return this.inventoryService.stockIn(
      req.user.organizationId,
      dto.branchId ??
        req.user.branchId,
      req.user.sub,
      dto,
    );
  }

@Permission(PermissionKey.INVENTORY_MANAGE)
  @Post('out')
  stockOut(
    @Req() req: any,
    @Body() dto: StockMovementDto,
  ) {
    return this.inventoryService.stockOut(
      req.user.organizationId,
      dto.branchId ??
        req.user.branchId,
      req.user.sub,
      dto,
    );
  }

@Permission(PermissionKey.INVENTORY_VIEW)
  @Get('movements')
  findMovements(
    @Req() req: any,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.findMovements(
      req.user.organizationId,
      branchId ??
        req.user.branchId,
    );
  }
}
