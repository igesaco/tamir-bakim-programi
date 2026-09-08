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
