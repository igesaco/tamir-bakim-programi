import {
  Body,
  Controller,
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
} from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { ServiceOrdersService } from './service-orders.service';

@UseGuards(AuthGuard('jwt'))
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
