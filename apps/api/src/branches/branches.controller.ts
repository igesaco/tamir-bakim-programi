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
import { FeatureKey, UserRole } from '@prisma/client';

import { Feature } from '../entitlements/feature.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Controller('branches')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)

export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.branchesService.findAll(
      req.user.organizationId,
    );
  }

  @Feature(FeatureKey.BRANCHES)
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(
      req.user.organizationId,
      dto,
    );
  }

  @Feature(FeatureKey.BRANCHES)
  @Patch(':id/active')
  setActive(
    @Req() req: any,
    @Param('id') id: string,
    @Body('active') active: boolean,
  ) {
    return this.branchesService.setActive(
      req.user.organizationId,
      id,
      active,
    );
  }
}
