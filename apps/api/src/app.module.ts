import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BranchesModule } from './branches/branches.module';

@Module({
  imports: [PrismaModule, OrganizationsModule, BranchesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}