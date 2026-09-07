import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserBranchDto } from './dto/update-user-branch.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  async me(@Req() req: any) {
    const user =
      await this.usersService.findById(
        req.user.sub,
      );

    if (!user) {
      throw new NotFoundException(
        'Kullanıcı bulunamadı.',
      );
    }

    const {
      passwordHash,
      ...safeUser
    } = user;

    return safeUser;
  }

  @Get('technicians')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.SERVICE_ADVISOR,
  )
  @UseGuards(RolesGuard)
  findTechnicians(@Req() req: any) {
    return this.usersService.findTechnicians(
      req.user.organizationId,
      req.user.role,
      req.user.branchId,
    );
  }

  @Get()
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
  )
  @UseGuards(RolesGuard)
  findAll(@Req() req: any) {
    return this.usersService.findAll(
      req.user.organizationId,
    );
  }

  @Post()
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
  )
  @UseGuards(RolesGuard)
  create(
    @Req() req: any,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(
      req.user.organizationId,
      req.user.role,
      dto,
    );
  }

  @Patch(':id/active')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
  )
  @UseGuards(RolesGuard)
  setActive(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveDto,
  ) {
    return this.usersService.setActive(
      req.user.organizationId,
      req.user.sub,
      req.user.role,
      id,
      dto.active,
    );
  }

  @Patch(':id/branch')
  @Roles(
    UserRole.OWNER,
    UserRole.MANAGER,
  )
  @UseGuards(RolesGuard)
  changeBranch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserBranchDto,
  ) {
    return this.usersService.changeBranch(
      req.user.organizationId,
      req.user.role,
      id,
      dto.branchId,
    );
  }
}
