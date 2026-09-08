import 'dotenv/config';

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EntitlementsModule } from '../entitlements/entitlements.module';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalJwtStrategy } from './customer-portal-jwt.strategy';
import { CustomerPortalService } from './customer-portal.service';

@Module({
  imports: [
    EntitlementsModule,
    PassportModule,
    JwtModule.register({
      secret:
        process.env.CUSTOMER_PORTAL_JWT_SECRET ||
        process.env.JWT_SECRET,
    }),
  ],
  controllers: [
    CustomerPortalController,
  ],
  providers: [
    CustomerPortalService,
    CustomerPortalJwtStrategy,
  ],
})
export class CustomerPortalModule {}
