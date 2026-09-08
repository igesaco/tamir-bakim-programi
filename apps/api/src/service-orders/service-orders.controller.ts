import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ServiceOrderStatus,
  UserRole,

  FeatureKey,
} from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { CreateServiceOrderItemDto } from './dto/create-service-order-item.dto';
import { ServiceOrdersService } from './service-orders.service';

@UseGuards(AuthGuard('jwt'))
@Feature(FeatureKey.SERVICE_ORDERS)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
  ) {}

  @Post()
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @UseGuards(RolesGuard)
  create(
    @Req() req: any,
    @Body() dto: CreateServiceOrderDto,
  ) {
    return this.serviceOrdersService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      dto,
    );
  }

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
  )
  @UseGuards(RolesGuard)
  findAll(@Req() req: any) {
    return this.serviceOrdersService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.sub,
      req.user.branchId,
    );
  }

  @Get(':id/available-parts')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @UseGuards(RolesGuard)
  availableParts(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.serviceOrdersService.availableParts(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }

  @Post(':id/items')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @UseGuards(RolesGuard)
  addItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateServiceOrderItemDto,
  ) {
    return this.serviceOrdersService.addItem(
      req.user.organizationId,
      id,
      req.user.sub,
      req.user.role,
      req.user.branchId,
      dto,
    );
  }

  @Patch(':id/items/:itemId/complete')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @UseGuards(RolesGuard)
  setItemComplete(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body('completed') completed: boolean,
  ) {
    return this.serviceOrdersService.setItemComplete(
      req.user.organizationId,
      id,
      itemId,
      req.user.role,
      req.user.branchId,
      completed,
    );
  }

  @Delete(':id/items/:itemId')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @UseGuards(RolesGuard)
  removeItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.serviceOrdersService.removeItem(
      req.user.organizationId,
      id,
      itemId,
      req.user.sub,
      req.user.role,
      req.user.branchId,
    );
  }

  @Get(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
  )
  @UseGuards(RolesGuard)
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.serviceOrdersService.findOne(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.sub,
      req.user.branchId,
    );
  }

  @Patch(':id/assign-technician')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @UseGuards(RolesGuard)
  assignTechnician(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignTechnicianDto,
  ) {
    return this.serviceOrdersService.assignTechnician(
      req.user.organizationId,
      id,
      dto.technicianId ?? null,
      req.user.role,
      req.user.branchId,
    );
  }

  @Patch(':id/status')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
  )
  @UseGuards(RolesGuard)
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body(
      'status',
      new ParseEnumPipe(ServiceOrderStatus),
    )
    status: ServiceOrderStatus,
  ) {
    return this.serviceOrdersService.updateStatus(
      req.user.organizationId,
      id,
      status,
      req.user.role,
      req.user.sub,
      req.user.branchId,
    );
  }
}
