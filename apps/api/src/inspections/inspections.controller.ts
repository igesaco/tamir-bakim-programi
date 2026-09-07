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
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { CreateInspectionItemDto } from './dto/create-inspection-item.dto';
import { InspectionsService } from './inspections.service';

@UseGuards(AuthGuard('jwt'))
@Roles(
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.SERVICE_ADVISOR,
)
@UseGuards(RolesGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(
    private readonly inspectionsService: InspectionsService,
  ) {}

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

  @Get()
  findAll(@Req() req: any) {
    return this.inspectionsService.findAll(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

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
