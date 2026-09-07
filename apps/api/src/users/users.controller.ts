import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findById(req.user.sub);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }
}