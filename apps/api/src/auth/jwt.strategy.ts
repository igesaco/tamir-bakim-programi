import 'dotenv/config';

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    const user =
      await this.usersService.findById(
        payload.sub,
      );

    if (
      !user ||
      !user.active ||
      !user.organization?.active
    ) {
      throw new UnauthorizedException(
        'Kullanıcı oturumu artık geçerli değil.',
      );
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId:
        user.organizationId,
      branchId: user.branchId,
    };
  }
}
