import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeatureKey,
  UserRole,
  PermissionKey,
} from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Permission } from '../permissions/permission.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { CreateInspectionItemDto } from './dto/create-inspection-item.dto';
import { InspectionsService } from './inspections.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)

@Feature(FeatureKey.INSPECTIONS)
@Controller('inspections')
export class InspectionsController {
  constructor(
    private readonly inspectionsService: InspectionsService,
  ) {}

@Permission(PermissionKey.INSPECTION_MANAGE)
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateInspectionDto,
  ) {
    return this.inspectionsService.create(
      req.user.organizationId,
      req.user.branchId,
      req.user.role,
      req.user.sub,
      dto,
    );
  }

@Permission(PermissionKey.INSPECTION_VIEW)
  @Get()
  findAll(@Req() req: any) {
    return this.inspectionsService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

@Permission(PermissionKey.INSPECTION_MANAGE)
  @Post(':id/items')
  addItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateInspectionItemDto,
  ) {
    return this.inspectionsService.addItem(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
      dto,
    );
  }

@Permission(PermissionKey.INSPECTION_MANAGE)
  @Patch(':id/complete')
  complete(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.inspectionsService.complete(
      req.user.organizationId,
      id,
      req.user.role,
      req.user.branchId,
    );
  }
}
