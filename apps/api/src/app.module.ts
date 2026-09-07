import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BranchesModule } from './branches/branches.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { InspectionsModule } from './inspections/inspections.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { InventoryModule } from './inventory/inventory.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BillingModule } from './billing/billing.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [PrismaModule, OrganizationsModule, BranchesModule, AuthModule, UsersModule, CustomersModule, VehiclesModule, AppointmentsModule, InspectionsModule, ServiceOrdersModule, QuotesModule, MaintenanceModule, InventoryModule, SuppliersModule, MediaModule, NotificationsModule, BillingModule, AuditModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}