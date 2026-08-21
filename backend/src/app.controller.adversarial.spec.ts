import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AppController, HealthCheckResponse } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';
import { RedisService } from './common/redis/redis.service';

describe('AppController - Adversarial Stress & Chaos Tests', () => {
  let appController: AppController;
  let mockSupabaseService: {
    getClient: jest.Mock;
  };
  let mockRedisService: {
    client: {
      status?: string;
      ping: jest.Mock;
    } | null;
  };
  let mockResponse: {
    status: jest.Mock<Response, [number]>;
    setHeader: jest.Mock<Response, [string, string]>;
  };
  const activeTimeouts: NodeJS.Timeout[] = [];

  beforeEach(async () => {
    mockSupabaseService = {
      getClient: jest.fn(),
    };

    mockRedisService = {
      client: {
        status: 'ready',
        ping: jest.fn(() => Promise.resolve('PONG')),
      },
    };

    const resObj = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    mockResponse = resObj;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  afterEach(() => {
    activeTimeouts.forEach((t) => clearTimeout(t));
    activeTimeouts.length = 0;
  });

  describe('Adversarial Latency & Timeout Behavior', () => {
    it('should trigger database timeout and return HTTP 503 when Supabase takes > 1500ms', async () => {
      const slowQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              const t = setTimeout(
                () => resolve({ data: [{ id: '123' }], error: null }),
                2000,
              );
              activeTimeouts.push(t);
            }),
        ),
      };
      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn().mockReturnValue(slowQueryBuilder),
      });

      const startTime = Date.now();
      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(1900);
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(result.status).toBe('error');
      expect(result.db).toBe('disconnected');
      expect(result.redis).toBe('connected');
    });

    it('should trigger Redis timeout and return HTTP 200 degraded when Redis takes > 1000ms', async () => {
      const fastQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn().mockReturnValue(fastQueryBuilder),
      });

      mockRedisService.client = {
        status: 'ready',
        ping: jest.fn(
          () =>
            new Promise<string>((resolve) => {
              const t = setTimeout(() => resolve('PONG'), 1800);
              activeTimeouts.push(t);
            }),
        ),
      };

      const startTime = Date.now();
      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(1500);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(result.status).toBe('degraded');
      expect(result.db).toBe('connected');
      expect(result.redis).toBe('disconnected');
    });
  });

  describe('Adversarial Status State Transitions', () => {
    it('should handle intermittent Redis reconnecting status states by marking degraded', async () => {
      const fastQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn().mockReturnValue(fastQueryBuilder),
      });

      const flakyStatuses = [
        'connecting',
        'reconnecting',
        'close',
        'end',
        'wait',
      ];

      for (const st of flakyStatuses) {
        mockRedisService.client = {
          status: st,
          ping: jest.fn(() => Promise.resolve('PONG')),
        };

        const result = await appController.getHealth(
          mockResponse as unknown as Response,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
        expect(result.status).toBe('degraded');
        expect(result.redis).toBe('disconnected');
      }
    });

    it('should return HTTP 503 error when BOTH DB and Redis are disconnected', async () => {
      mockSupabaseService.getClient.mockReturnValue(null);
      mockRedisService.client = null;

      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(result.status).toBe('error');
      expect(result.db).toBe('disconnected');
      expect(result.redis).toBe('disconnected');
    });

    it('should enforce Cache-Control headers to prevent intermediary caching of health probes', async () => {
      mockSupabaseService.getClient.mockReturnValue(null);

      await appController.getHealth(mockResponse as unknown as Response);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache, no-store, must-revalidate',
      );
    });
  });
});
