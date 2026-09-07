import {
  INestApplication,
} from '@nestjs/common';
import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('API health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture:
      TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app =
      moduleFixture.createNestApplication();

    await app.init();
  });

  it('/health (GET)', async () => {
    const response =
      await request(
        app.getHttpServer(),
      )
        .get('/health')
        .expect(200);

    expect(
      response.body.status,
    ).toBe('ok');

    expect(
      response.body.database,
    ).toBe('ok');

    expect(
      response.body.timestamp,
    ).toEqual(
      expect.any(String),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
