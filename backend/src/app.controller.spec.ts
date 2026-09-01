import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AppController, HealthCheckResponse } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';
import { RedisService } from './common/redis/redis.service';

interface MockRedisClient {
  status: string;
  ping: () => Promise<string>;
}

describe('AppController', () => {
  let appController: AppController;
  let mockSupabaseService: {
    getClient: jest.Mock;
  };
  let mockRedisService: {
    client: MockRedisClient | null;
  };
  let mockResponse: {
    status: jest.Mock<Response, [number]>;
    setHeader: jest.Mock<Response, [string, string]>;
  };

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

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('getHealth', () => {
    it('should return status "ok" and HTTP 200 when both DB and Redis are connected', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockClient = {
        from: jest.fn().mockReturnValue(mockQueryBuilder),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(result.status).toBe('ok');
      expect(result.db).toBe('connected');
      expect(result.redis).toBe('connected');
      expect(typeof result.uptime).toBe('number');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.version).toBe('string');
    });

    it('should return status "degraded" and HTTP 200 when Redis is disconnected but DB is connected', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      const mockClient = {
        from: jest.fn().mockReturnValue(mockQueryBuilder),
      };
      mockSupabaseService.getClient.mockReturnValue(mockClient);

      // Redis client not ready
      mockRedisService.client = null;

      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(result.status).toBe('degraded');
      expect(result.db).toBe('connected');
      expect(result.redis).toBe('disconnected');
    });

    it('should return status "degraded" when Redis ping rejects', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      mockRedisService.client = {
        status: 'ready',
        ping: jest.fn(() => Promise.reject(new Error('Redis connection lost'))),
      };

      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(result.status).toBe('degraded');
      expect(result.db).toBe('connected');
      expect(result.redis).toBe('disconnected');
    });

    it('should return status "error" and HTTP 503 when Supabase DB is disconnected', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'DB down' } }),
      };
      mockSupabaseService.getClient.mockReturnValue({
        from: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(result.status).toBe('error');
      expect(result.db).toBe('disconnected');
      expect(result.redis).toBe('connected');
    });

    it('should return status "error" and HTTP 503 when Supabase client throws or is null', async () => {
      mockSupabaseService.getClient.mockReturnValue(null);

      const result: HealthCheckResponse = await appController.getHealth(
        mockResponse as unknown as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(result.status).toBe('error');
      expect(result.db).toBe('disconnected');
    });
  });
});
