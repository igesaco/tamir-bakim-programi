import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns API identity', () => {
      expect(appController.root()).toMatchObject({
        name: 'Tamir Bakım API',
        status: 'online',
        health: '/health',
      });
    });

    it('checks the database before reporting healthy', async () => {
      await expect(appController.health()).resolves.toMatchObject({
        status: 'ok',
        database: 'ok',
      });
    });
  });
});
