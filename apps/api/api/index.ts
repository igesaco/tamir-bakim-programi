import type { Request, Response } from 'express';

let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
    await import('reflect-metadata');
    const { ValidationPipe } = await import('@nestjs/common');
    const { NestFactory } = await import('@nestjs/core');
    const { ExpressAdapter } = await import('@nestjs/platform-express');
    const expressModule = await import('express');
    const express = (expressModule as any).default || expressModule;
    const helmetModule = await import('helmet');
    const helmet = (helmetModule as any).default || helmetModule;
    const { AppModule } = await import('../dist/app.module.js');

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
      stack: err?.stack,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      tip: !process.env.DATABASE_URL
        ? 'DATABASE_URL tanımı bulunamadı. Vercel Dashboard -> Settings -> Environment Variables bölümünden Neon bağlantı adresinizi (DATABASE_URL) eklemeniz gerekmektedir.'
        : undefined,
    });
  }
}
