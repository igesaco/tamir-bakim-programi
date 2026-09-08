import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CustomerPortalService } from './customer-portal.service';
import { StartPortalAccessDto } from './dto/start-portal-access.dto';
import { StartPortalQrAccessDto } from './dto/start-portal-qr-access.dto';
import { VerifyPortalAccessDto } from './dto/verify-portal-access.dto';

@Controller('customer-portal')
export class CustomerPortalController {
  constructor(
    private readonly customerPortalService: CustomerPortalService,
  ) {}

  @Post('access/start')
  start(
    @Body() dto: StartPortalAccessDto,
  ) {
    return this.customerPortalService.start(
      dto,
    );
  }

  @Post('access/qr/start')
  startFromQr(
    @Body() dto: StartPortalQrAccessDto,
  ) {
    return this.customerPortalService.startFromQr(
      dto,
    );
  }

  @Post('access/verify')
  verify(
    @Body() dto: VerifyPortalAccessDto,
  ) {
    return this.customerPortalService.verify(
      dto,
    );
  }

  @Get('me')
  @UseGuards(
    AuthGuard(
      'customer-portal-jwt',
    ),
  )
  me(@Req() req: any) {
    return this.customerPortalService.getPortalData(
      req.user.customerId,
      req.user.vehicleId,
      req.user.organizationId,
    );
  }
}
