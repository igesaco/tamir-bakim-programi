import {
  Body,
  Controller,
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
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Feature(FeatureKey.CASHIER)
@Controller('billing')
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
)

export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

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

  @Get('payments')
  findAll(@Req() req: any) {
    return this.billingService.findAll(
      req.user.organizationId,
    );
  }
}
