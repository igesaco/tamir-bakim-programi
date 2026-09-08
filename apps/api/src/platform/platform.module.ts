import 'dotenv/config';

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { EntitlementsModule } from '../entitlements/entitlements.module';
import { PlatformController } from './platform.controller';
import { PlatformGuard } from './platform.guard';
import { PlatformService } from './platform.service';

@Module({
  imports: [
    EntitlementsModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [
    PlatformController,
  ],
  providers: [
    PlatformService,
    PlatformGuard,
  ],
})
export class PlatformModule {}
