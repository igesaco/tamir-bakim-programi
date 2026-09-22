import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  FeatureKey,
  PaymentMethod,
  PaymentStatus,
  PermissionKey,
  UserRole,
} from '@prisma/client';

import { Permission } from '../permissions/permission.decorator';
import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Feature(FeatureKey.CASHIER)
@Controller('billing')
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.ACCOUNTING,
)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Permission(PermissionKey.CASHIER_COLLECT)
  @Post('payments')
  create(
    @Req() req: any,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.billingService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      dto,
    );
  }

  @Permission(PermissionKey.CASHIER_STATUS)
  @Patch('payments/:id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.billingService.updateStatus(
      req.user.organizationId,
      id,
      dto.status,
    );
  }

  @Permission(PermissionKey.CASHIER_VIEW)
  @Get('customer-balance/:customerId')
  getCustomerBalance(
    @Req() req: any,
    @Param('customerId') customerId: string,
  ) {
    return this.billingService.getCustomerBalance(
      req.user.organizationId,
      customerId,
    );
  }

  @Permission(PermissionKey.CASHIER_VIEW)
  @Get('aging-report')
  getAgingReport(@Req() req: any) {
    return this.billingService.getAgingReport(
      req.user.organizationId,
    );
  }

  @Permission(PermissionKey.CASHIER_VIEW)
  @Get('summary')
  getSummary(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.billingService.getSummary(
      req.user.organizationId,
      from,
      to,
    );
  }

  @Permission(PermissionKey.CASHIER_VIEW)
  @Get('payments')
  findAll(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('method') method?: PaymentMethod,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.billingService.findAll(req.user.organizationId, {
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      customerId,
      method,
      status,
    });
  }
}
