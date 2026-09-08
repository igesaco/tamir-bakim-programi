import {
  Controller,
  Get,
} from '@nestjs/common';

import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  root() {
    return {
      name: 'Tamir Bakım API',
      status: 'online',
      webApplication:
        'https://tamir-bakim-programi.onrender.com',
      health:
        '/health',
    };
  }

  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
