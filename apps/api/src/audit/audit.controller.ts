import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeatureKey, UserRole } from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from './audit.service';

@UseGuards(AuthGuard('jwt'))
@Feature(FeatureKey.AUDIT)
@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  findAll(@Req() req: any) {
    return this.auditService.findAll(
      req.user.organizationId,
    );
  }
}
