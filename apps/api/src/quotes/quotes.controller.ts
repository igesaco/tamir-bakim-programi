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
  QuoteStatus,
  UserRole,
  FeatureKey,
  PermissionKey,
} from '@prisma/client';

import { Permission } from '../permissions/permission.decorator';
import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuotesService } from './quotes.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
  UserRole.ACCOUNTING,
)

@Feature(FeatureKey.QUOTES)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
  ) {}

@Permission(PermissionKey.QUOTE_CREATE)
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      dto,
    );
  }

@Permission(PermissionKey.QUOTE_VIEW)
  @Get()
  findAll(@Req() req: any) {
    return this.quotesService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

@Permission(PermissionKey.QUOTE_VIEW)
  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.quotesService.findOne(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }

@Permission(PermissionKey.QUOTE_STATUS)
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body(
      'status',
      new ParseEnumPipe(QuoteStatus),
    )
    status: QuoteStatus,
  ) {
    return this.quotesService.updateStatus(
      req.user.organizationId,
      id,
      status,
      req.user.role,
      req.user.branchId,
    );
  }
}
