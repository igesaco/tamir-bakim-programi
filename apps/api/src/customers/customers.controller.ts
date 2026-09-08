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
import { FeatureKey, UserRole } from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)

@Feature(FeatureKey.CUSTOMERS)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.customersService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.customersService.remove(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }
}
