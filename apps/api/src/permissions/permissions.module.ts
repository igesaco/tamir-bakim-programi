import {
  Global,
  Module,
} from '@nestjs/common';
import {
  APP_INTERCEPTOR,
} from '@nestjs/core';

import { PermissionAccessInterceptor } from './permission-access.interceptor';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  providers: [
    PermissionsService,
    {
      provide:
        APP_INTERCEPTOR,
      useClass:
        PermissionAccessInterceptor,
    },
  ],
  exports: [
    PermissionsService,
  ],
})
export class PermissionsModule {}
