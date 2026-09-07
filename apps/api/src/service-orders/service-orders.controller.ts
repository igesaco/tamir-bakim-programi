import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceOrderStatus } from '@prisma/client';

import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateServiceOrderDto) {
    return this.serviceOrdersService.create(
      req.user.organizationId,
      req.user.branchId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.serviceOrdersService.findAll(
      req.user.organizationId,
    );
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.serviceOrdersService.findOne(
      req.user.organizationId,
      id,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(ServiceOrderStatus))
    status: ServiceOrderStatus,
  ) {
    return this.serviceOrdersService.updateStatus(
      req.user.organizationId,
      id,
      status,
    );
  }
}
