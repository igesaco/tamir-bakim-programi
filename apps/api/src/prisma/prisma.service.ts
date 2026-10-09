import 'dotenv/config';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn(
        '⚠️ DATABASE_URL ortam değişkeni bulunamadı! Lütfen Vercel Environment Variables kısmından tanımlayın.',
      );
    }
    const adapter = new PrismaPg({
      connectionString: connectionString || 'postgresql://unconfigured@localhost:5432/db',
    });
    super({ adapter });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn(
        'DATABASE_URL tanımlanmadığı için Prisma veritabanına bağlanamadı.',
      );
      return;
    }
    try {
      await this.$connect();
      this.logger.log('Prisma veritabanına başarıyla bağlandı.');
    } catch (err: any) {
      this.logger.error('Prisma bağlantı hatası:', err?.message || err);
    }
  }
}