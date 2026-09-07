import { Module } from '@nestjs/common';

import { RolesGuard } from '../auth/roles.guard';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  providers: [
    QuotesService,
    RolesGuard,
  ],
  controllers: [QuotesController],
})
export class QuotesModule {}
