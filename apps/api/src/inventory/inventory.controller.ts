import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { InventoryService } from './inventory.service';
import { CreatePartDto } from './dto/create-part.dto';
import { StockMovementDto } from './dto/stock-movement.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

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

  @Get('parts')
  findParts(@Req() req: any) {
    return this.inventoryService.findParts(
      req.user.organizationId,
    );
  }

  @Get('stock')
  findStock(@Req() req: any) {
    return this.inventoryService.findStock(
      req.user.organizationId,
      req.user.branchId,
    );
  }

  @Get('low-stock')
  findLowStock(@Req() req: any) {
    return this.inventoryService.findLowStock(
      req.user.organizationId,
      req.user.branchId,
    );
  }

  @Post('in')
  stockIn(
    @Req() req: any,
    @Body() dto: StockMovementDto,
  ) {
    return this.inventoryService.stockIn(
      req.user.organizationId,
      req.user.branchId,
      req.user.sub,
      dto,
    );
  }

  @Post('out')
  stockOut(
    @Req() req: any,
    @Body() dto: StockMovementDto,
  ) {
    return this.inventoryService.stockOut(
      req.user.organizationId,
      req.user.branchId,
      req.user.sub,
      dto,
    );
  }

  @Get('movements')
  findMovements(@Req() req: any) {
    return this.inventoryService.findMovements(
      req.user.organizationId,
      req.user.branchId,
    );
  }
}
