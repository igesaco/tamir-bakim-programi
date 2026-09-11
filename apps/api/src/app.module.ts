import 'dotenv/config';

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SafeResponseInterceptor } from './workflow/safe-response.interceptor';
import {
  mkdirSync,
} from 'fs';
import {
  resolve,
} from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AppointmentsModule } from './appointments/appointments.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { BranchesModule } from './branches/branches.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { CustomersModule } from './customers/customers.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { InspectionsModule } from './inspections/inspections.module';
import { InventoryModule } from './inventory/inventory.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PlatformModule } from './platform/platform.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuotesModule } from './quotes/quotes.module';
import { ReportsModule } from './reports/reports.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UsersModule } from './users/users.module';
import { VehicleCatalogModule } from './vehicle-catalog/vehicle-catalog.module';
import { VehiclesModule } from './vehicles/vehicles.module';

const mediaStorageDir =
  resolve(
    process.env.MEDIA_STORAGE_DIR ??
      './uploads',
  );

mkdirSync(
  mediaStorageDir,
  {
    recursive: true,
  },
);

@Module({
  imports: [
    PrismaModule,
    EntitlementsModule,
    PermissionsModule,
    PlatformModule,
    OrganizationsModule,
    BranchesModule,
    AuthModule,
    UsersModule,
    CustomerPortalModule,
    CustomersModule,
    VehiclesModule,
    AppointmentsModule,
    InspectionsModule,
    ServiceOrdersModule,
    QuotesModule,
    MaintenanceModule,
    InventoryModule,
    SuppliersModule,
    MediaModule,
    NotificationsModule,
    BillingModule,
    AuditModule,
    ReportsModule,
    VehicleCatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: SafeResponseInterceptor }],
})
export class AppModule {}
