import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const jwtSecret =
    process.env.JWT_SECRET?.trim();

  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required.',
    );
  }

  if (
    process.env.NODE_ENV ===
      'production' &&
    jwtSecret.length < 32
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters in production.',
    );
  }

  const app =
    await NestFactory.create(
      AppModule,
      {
        rawBody: true,
      },
    );

  app.use(helmet());

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS
        .split(',')
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

  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    const swaggerConfig =
      new DocumentBuilder()
        .setTitle('Tamir Bakım API')
        .setDescription(
          'Tamir ve bakım yönetim sistemi API dokümantasyonu',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document =
      SwaggerModule.createDocument(
        app,
        swaggerConfig,
      );

    SwaggerModule.setup(
      'api-docs',
      app,
      document,
    );
  }

  await app.listen(
    Number(process.env.PORT) || 3000,
    '0.0.0.0',
  );
}

bootstrap();
