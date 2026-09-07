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

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(
      req.user.organizationId,
      req.user.branchId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.customersService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.customersService.findOne(req.user.organizationId, id);
  }
}