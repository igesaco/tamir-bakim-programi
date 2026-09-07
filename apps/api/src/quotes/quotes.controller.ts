import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuoteStatus } from '@prisma/client';

import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateQuoteDto) {
    return this.quotesService.create(
      req.user.organizationId,
      req.user.branchId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.quotesService.findAll(
      req.user.organizationId,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(QuoteStatus))
    status: QuoteStatus,
  ) {
    return this.quotesService.updateStatus(
      req.user.organizationId,
      id,
      status,
    );
  }
}
