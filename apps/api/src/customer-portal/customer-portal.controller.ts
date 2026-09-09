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

import { CustomerPortalService } from './customer-portal.service';
import { StartPortalAccessDto } from './dto/start-portal-access.dto';
import { StartPortalQrAccessDto } from './dto/start-portal-qr-access.dto';
import { StartPortalPhoneAccessDto } from './dto/start-portal-phone-access.dto';
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

  @Post('access/phone/start')
  startFromPhone(
    @Body() dto: StartPortalPhoneAccessDto,
  ) {
    return this.customerPortalService.startFromPhone(
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

  @Get('vehicles')
  @UseGuards(
    AuthGuard(
      'customer-portal-jwt',
    ),
  )
  vehicles(@Req() req: any) {
    return this.customerPortalService.getCustomerVehicles(
      req.user.customerId,
      req.user.organizationId,
    );
  }

  @Get('vehicles/:vehicleId')
  @UseGuards(
    AuthGuard(
      'customer-portal-jwt',
    ),
  )
  vehicle(
    @Req() req: any,
    @Param('vehicleId')
    vehicleId: string,
  ) {
    return this.customerPortalService.getPortalData(
      req.user.customerId,
      vehicleId,
      req.user.organizationId,
    );
  }

  @Post('quotes/:quoteId/approve')
  @UseGuards(
    AuthGuard(
      'customer-portal-jwt',
    ),
  )
  approveQuote(
    @Req() req: any,
    @Param('quoteId')
    quoteId: string,
  ) {
    return this.customerPortalService.approveCustomerQuote(
      req.user.customerId,
      req.user.organizationId,
      quoteId,
    );
  }

  @Get('notifications')
  @UseGuards(
    AuthGuard(
      'customer-portal-jwt',
    ),
  )
  notifications(@Req() req: any) {
    return this.customerPortalService.getCustomerNotifications(
      req.user.customerId,
      req.user.organizationId,
    );
  }

  @Post('notifications/:id/read')
  @UseGuards(
    AuthGuard(
      'customer-portal-jwt',
    ),
  )
  readNotification(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.customerPortalService.markCustomerNotificationRead(
      req.user.customerId,
      req.user.organizationId,
      id,
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
