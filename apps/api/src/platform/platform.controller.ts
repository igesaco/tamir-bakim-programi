import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  FeatureKey,
  PermissionKey,
  UserRole,
} from '@prisma/client';
import {
  IsEmail,
  IsString,
} from 'class-validator';

import { PlatformGuard } from './platform.guard';
import { PlatformService } from './platform.service';
import { ReplaceRolePermissionsDto } from './dto/replace-role-permissions.dto';
import { SetFeatureOverrideDto } from './dto/set-feature-override.dto';
import { SetRolePermissionDto } from './dto/set-role-permission.dto';
import { UpdateOrganizationPackageDto } from './dto/update-organization-package.dto';
import { CreatePlatformLedgerEntryDto } from './dto/create-platform-ledger-entry.dto';
import { UpdateOrganizationBrandingDto } from './dto/update-organization-branding.dto';
import { UpdateOrganizationCommercialDto } from './dto/update-organization-commercial.dto';
import { ResetUserPasswordDto } from '../users/dto/reset-user-password.dto';
import { UpdateUserActiveDto } from '../users/dto/update-user-active.dto';
import { UpdateTenantOwnerDto } from './dto/update-tenant-owner.dto';

class PlatformLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('platform')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
  ) {}

  @Post('login')
  login(
    @Body() dto: PlatformLoginDto,
  ) {
    return this.platformService.login(
      dto.email,
      dto.password,
    );
  }

  @Get('me')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  me(@Req() req: any) {
    return this.platformService.me(
      req.user.sub,
    );
  }

  @Get('packages')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  packages() {
    return this.platformService.listPackages();
  }

  @Get('organizations')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  organizations() {
    return this.platformService.listOrganizations();
  }

  @Patch('organizations/:id/branding')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  updateBranding(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationBrandingDto,
  ) {
    return this.platformService.updateOrganizationBranding(
      id,
      dto,
    );
  }

  @Patch('organizations/:id/commercial')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  updateCommercial(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationCommercialDto,
  ) {
    return this.platformService.updateOrganizationCommercial(
      id,
      dto,
    );
  }

  @Get('organizations/:id/ledger')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  ledger(
    @Param('id') id: string,
  ) {
    return this.platformService.listLedger(
      id,
    );
  }

  @Post('organizations/:id/ledger')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  createLedgerEntry(
    @Param('id') id: string,
    @Body() dto: CreatePlatformLedgerEntryDto,
  ) {
    return this.platformService.createLedgerEntry(
      id,
      dto,
    );
  }

  @Patch('organizations/:id/package')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  setPackage(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationPackageDto,
  ) {
    return this.platformService.setPackage(
      id,
      dto.packageId,
    );
  }

  @Put('organizations/:id/features/:feature')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  setFeature(
    @Param('id') id: string,
    @Param('feature') feature: FeatureKey,
    @Body() dto: SetFeatureOverrideDto,
  ) {
    return this.platformService.setFeatureOverride(
      id,
      feature,
      dto.enabled,
    );
  }

  @Delete('organizations/:id/features/:feature')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  removeFeature(
    @Param('id') id: string,
    @Param('feature') feature: FeatureKey,
  ) {
    return this.platformService.removeFeatureOverride(
      id,
      feature,
    );
  }

  @Put('organizations/:id/roles/:role/permissions/:permission')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  setRolePermission(
    @Param('id') id: string,
    @Param('role') role: UserRole,
    @Param('permission') permission: PermissionKey,
    @Body() dto: SetRolePermissionDto,
  ) {
    return this.platformService.setRolePermission(
      id,
      role,
      permission,
      dto.allowed,
    );
  }

  @Put('organizations/:id/roles/:role/permissions')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  replaceRolePermissions(
    @Param('id') id: string,
    @Param('role') role: UserRole,
    @Body() dto: ReplaceRolePermissionsDto,
  ) {
    return this.platformService.replaceRolePermissions(
      id,
      role,
      dto.permissions,
    );
  }

  @Delete('organizations/:id/roles/:role/permissions')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  resetRolePermissions(
    @Param('id') id: string,
    @Param('role') role: UserRole,
  ) {
    return this.platformService.resetRolePermissions(
      id,
      role,
    );
  }

  @Patch('organizations/:id/users/:userId/profile')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  updateTenantOwnerProfile(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTenantOwnerDto,
  ) {
    return this.platformService.updateTenantOwnerProfile(
      id,
      userId,
      dto,
    );
  }

  @Patch('organizations/:id/users/:userId/active')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  setTenantUserActive(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserActiveDto,
  ) {
    return this.platformService.setTenantUserActive(
      id,
      userId,
      dto.active,
    );
  }

  @Patch('organizations/:id/users/:userId/password')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  resetTenantUserPassword(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.platformService.resetTenantUserPassword(
      id,
      userId,
      dto.password,
    );
  }

  @Post('organizations/:id/impersonate')
  @UseGuards(
    AuthGuard('jwt'),
    PlatformGuard,
  )
  impersonate(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.platformService.impersonateOrganization(
      req.user.sub,
      id,
    );
  }
}
