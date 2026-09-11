import { LinkMaintenancePlansDto } from './dto/link-maintenance-plans.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseBoolPipe,
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
  PermissionKey,
} from '@prisma/client';

import { Permission } from '../permissions/permission.decorator';
import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { CreateServiceOrderItemDto } from './dto/create-service-order-item.dto';
import { CreateServiceOrderWorkLogDto } from './dto/create-service-order-work-log.dto';
import { ServiceOrdersService } from './service-orders.service';

@UseGuards(AuthGuard('jwt'))
@Feature(FeatureKey.SERVICE_ORDERS)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(
    private readonly serviceOrdersService: ServiceOrdersService,
  ) {}

  @Permission(PermissionKey.MAINTENANCE_MANAGE)
  @Patch(':id/maintenance-plans')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.SERVICE_ADVISOR, UserRole.ACCOUNTING)
  @UseGuards(RolesGuard)
  linkMaintenancePlans(@Req() req: any, @Param('id') id: string, @Body() dto: LinkMaintenancePlansDto) {
    return this.serviceOrdersService.linkMaintenancePlans(req.user.organizationId, id, req.user.role, req.user.sub, req.user.branchId, dto.ids);
  }

@Permission(PermissionKey.SERVICE_ORDER_CREATE)
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

@Permission(PermissionKey.SERVICE_ORDER_VIEW)
  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
    UserRole.ACCOUNTING,
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

@Permission(PermissionKey.SERVICE_ORDER_VIEW)
  @Get(':id/available-parts')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
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

@Permission(PermissionKey.SERVICE_ORDER_ITEM_MANAGE)
  @Post(':id/items')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
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

@Permission(PermissionKey.SERVICE_ORDER_ITEM_COMPLETE)
  @Patch(':id/items/:itemId/complete')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
    UserRole.TECHNICIAN,
  )
  @UseGuards(RolesGuard)
  setItemComplete(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body('completed', ParseBoolPipe) completed: boolean,
  ) {
    return this.serviceOrdersService.setItemComplete(
      req.user.organizationId,
      id,
      itemId,
      req.user.role,
      req.user.sub,
      req.user.branchId,
      completed,
    );
  }

@Permission(PermissionKey.SERVICE_ORDER_ITEM_MANAGE)
  @Delete(':id/items/:itemId')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
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

@Permission(PermissionKey.SERVICE_ORDER_WORKLOG)
  @Get(':id/work-logs')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
  )
  @UseGuards(RolesGuard)
  workLogs(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.serviceOrdersService.findWorkLogs(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.sub,
      req.user.branchId,
    );
  }

@Permission(PermissionKey.SERVICE_ORDER_WORKLOG)
  @Post(':id/work-logs')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
  )
  @UseGuards(RolesGuard)
  addWorkLog(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateServiceOrderWorkLogDto,
  ) {
    return this.serviceOrdersService.addWorkLog(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.sub,
      req.user.branchId,
      dto,
    );
  }

@Permission(PermissionKey.SERVICE_ORDER_VIEW)
  @Get(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.TECHNICIAN,
    UserRole.ACCOUNTING,
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

@Permission(PermissionKey.SERVICE_ORDER_ASSIGN)
  @Patch(':id/assign-technician')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
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

@Permission(PermissionKey.SERVICE_ORDER_STATUS)
  @Patch(':id/status')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
    UserRole.ACCOUNTING,
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
    @Body('creditDeliveryReason') creditDeliveryReason?: string,
  ) {
    return this.serviceOrdersService.updateStatus(
      req.user.organizationId,
      id,
      status,
      req.user.role,
      req.user.sub,
      req.user.branchId,
      creditDeliveryReason,
    );
  }
}
