import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppController, HealthCheckResponse } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { SupabaseService } from '../src/supabase/supabase.service';
import { RedisService } from '../src/common/redis/redis.service';

type HttpApp = Parameters<typeof request>[0];

describe('AppController smoke (e2e)', () => {
  let app: INestApplication;
  let httpApp: HttpApp;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => ({
              from: () => ({
                select: () => ({
                  limit: () => Promise.resolve({ error: null }),
                }),
              }),
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            client: {
              status: 'ready',
              ping: () => Promise.resolve('PONG'),
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpApp = app.getHttpServer() as HttpApp;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / returns hello world', () => {
    return request(httpApp).get('/').expect(200).expect('Hello World!');
  });

  it('GET /health returns ok when dependencies are reachable', async () => {
    const response = await request(httpApp).get('/health').expect(200);
    const body = response.body as HealthCheckResponse;

    expect(response.headers['cache-control']).toBe(
      'no-cache, no-store, must-revalidate',
    );
    expect(body).toMatchObject({
      status: 'ok',
      db: 'connected',
      redis: 'connected',
      version: '0.0.1',
    });
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.uptime).toBe('number');
  });
});
