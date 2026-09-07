import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';

import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Get('me')
  findMine(@Req() req: any) {
    return this.organizationsService.findMine(
      req.user.organizationId,
    );
  }

  @Patch('me')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  updateMine(
    @Req() req: any,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateMine(
      req.user.organizationId,
      dto,
    );
  }
}
