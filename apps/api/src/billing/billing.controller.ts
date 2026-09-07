import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('billing')
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
)
@UseGuards(RolesGuard)
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

  @Get('payments')
  findAll(@Req() req: any) {
    return this.billingService.findAll(
      req.user.organizationId,
    );
  }
}
