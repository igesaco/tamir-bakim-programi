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

import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('branches')
@UseGuards(AuthGuard('jwt'))
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

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  create(
    @Req() req: any,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(
      req.user.organizationId,
      dto,
    );
  }

  @Patch(':id/active')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(RolesGuard)
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
