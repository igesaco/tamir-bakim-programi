import {
  Global,
  Module,
} from '@nestjs/common';
import {
  APP_INTERCEPTOR,
} from '@nestjs/core';

import { EntitlementsService } from './entitlements.service';
import { FeatureAccessInterceptor } from './feature-access.interceptor';

@Global()
@Module({
  providers: [
    EntitlementsService,
    {
      provide:
        APP_INTERCEPTOR,
      useClass:
        FeatureAccessInterceptor,
    },
  ],
  exports: [
    EntitlementsService,
  ],
})
export class EntitlementsModule {}
