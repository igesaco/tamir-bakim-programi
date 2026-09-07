import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('billing')
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
