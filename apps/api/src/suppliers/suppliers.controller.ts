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
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SuppliersService } from './suppliers.service';

@UseGuards(AuthGuard('jwt'))
@Controller('suppliers')
@Roles(UserRole.OWNER, UserRole.MANAGER)
@UseGuards(RolesGuard)
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(
      req.user.organizationId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.suppliersService.findAll(
      req.user.organizationId,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.findOne(
      req.user.organizationId,
      id,
    );
  }
}
