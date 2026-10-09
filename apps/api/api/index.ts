import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

let cachedServer: Express;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { rawBody: true },
    );

    app.use(helmet());

    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://tamircim.vercel.app',
    ];

    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : defaultOrigins;

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  try {
    const server = await bootstrapServer();
    return server(req, res);
  } catch (err: any) {
    console.error('SERVERLESS_BOOTSTRAP_ERROR:', err);
    return res.status(500).json({
      error: 'SERVERLESS_BOOTSTRAP_ERROR',
      message: err?.message || String(err),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      tip: !process.env.DATABASE_URL
        ? 'DATABASE_URL tanımı bulunamadı. Vercel Dashboard -> Settings -> Environment Variables bölümünden Neon bağlantı adresinizi (DATABASE_URL) eklemeniz gerekmektedir.'
        : undefined,
    });
  }
}
