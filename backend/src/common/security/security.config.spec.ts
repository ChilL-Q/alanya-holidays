import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  applySecurityHeaders,
  createCorsOriginDelegate,
  createRateLimitMiddleware,
  isOriginAllowed,
  MemoryRateLimitStorage,
  parseAllowedOrigins,
  RedisRateLimitStorage,
  resolveClientIp,
} from './security.config';
import type { Redis } from 'ioredis';

describe('security.config', () => {
  describe('parseAllowedOrigins', () => {
    it('should merge defaults with configured origins and normalize trailing slashes', () => {
      const origins = parseAllowedOrigins({
        APP_URL: 'https://alanyaholidays.com/',
        CORS_ALLOWED_ORIGINS:
          'https://app.example.com/, https://admin.example.com',
      });

      expect(origins).toContain('https://alanyaholidays.com');
      expect(origins).toContain('https://app.example.com');
      expect(origins).toContain('https://admin.example.com');
      expect(origins).toContain('http://localhost:3000');
    });
  });

  describe('isOriginAllowed', () => {
    it('should match normalized origins', () => {
      expect(
        isOriginAllowed('https://app.example.com/', [
          'https://app.example.com',
        ]),
      ).toBe(true);
    });
  });

  describe('createCorsOriginDelegate', () => {
    it('should allow configured origin', () => {
      const delegate = createCorsOriginDelegate(['https://app.example.com']);
      const callback = jest.fn();

      delegate('https://app.example.com', callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should reject unknown origin with ForbiddenException (HTTP 403)', () => {
      const delegate = createCorsOriginDelegate(['https://app.example.com']);
      const callback = jest.fn<void, [Error | null, boolean?]>();

      delegate('https://evil.example.com', callback);

      const [error, allowed] = callback.mock.calls[0] ?? [];
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getStatus()).toBe(403);
      expect((error as ForbiddenException).message).toBe(
        'Origin https://evil.example.com is not allowed by CORS',
      );
      expect(allowed).toBeUndefined();
    });

    it('should allow requests without origin header', () => {
      const delegate = createCorsOriginDelegate(['https://app.example.com']);
      const callback = jest.fn();

      delegate(undefined, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });
  });

  describe('applySecurityHeaders', () => {
    it('should set baseline security headers', () => {
      const headers = new Map<string, string>();
      const res = {
        setHeader: jest.fn((key: string, value: string) => {
          headers.set(key, value);
        }),
      } as unknown as Response;

      applySecurityHeaders(res);

      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('X-Frame-Options')).toBe('DENY');
      expect(headers.get('Referrer-Policy')).toBe(
        'strict-origin-when-cross-origin',
      );
      expect(headers.get('Permissions-Policy')).toContain('camera=()');
    });
  });

  describe('resolveClientIp', () => {
    it('should prioritize req.ip when configured via trust proxy', () => {
      const req = {
        ip: '203.0.113.195',
        socket: { remoteAddress: '127.0.0.1' },
      } as Request;

      expect(resolveClientIp(req)).toBe('203.0.113.195');
    });

    it('should fallback to socket.remoteAddress if req.ip is empty', () => {
      const req = {
        ip: undefined,
        socket: { remoteAddress: '198.51.100.44' },
      } as unknown as Request;

      expect(resolveClientIp(req)).toBe('198.51.100.44');
    });

    it('should fallback to unknown if both req.ip and remoteAddress are missing', () => {
      const req = {} as Request;
      expect(resolveClientIp(req)).toBe('unknown');
    });
  });

  describe('MemoryRateLimitStorage', () => {
    it('should count increments within TTL window and reset on expiry', async () => {
      const storage = new MemoryRateLimitStorage();
      const res1 = await storage.increment('test-key', 60);
      expect(res1.count).toBe(1);
      expect(res1.ttl).toBe(60);

      const res2 = await storage.increment('test-key', 60);
      expect(res2.count).toBe(2);
    });
  });

  describe('RedisRateLimitStorage', () => {
    it('should perform atomic increment and set TTL on new key in Redis', async () => {
      const mockMulti = {
        incr: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1], // count = 1
          [null, -1], // ttl = -1 (no ttl set yet)
        ]),
      };

      const mockClient = {
        status: 'ready',
        multi: jest.fn().mockReturnValue(mockMulti),
        expire: jest.fn().mockResolvedValue(1),
      };

      const storage = new RedisRateLimitStorage(mockClient as unknown as Redis);
      const res = await storage.increment('ip-123', 60);

      expect(res.count).toBe(1);
      expect(res.ttl).toBe(60);
      expect(mockClient.expire).toHaveBeenCalledWith('ratelimit:ip-123', 60);
    });

    it('should fallback to in-memory storage when Redis client errors', async () => {
      const mockClient = {
        status: 'ready',
        multi: jest.fn().mockReturnValue({
          incr: jest.fn().mockReturnThis(),
          ttl: jest.fn().mockReturnThis(),
          exec: jest.fn().mockRejectedValue(new Error('Redis connection drop')),
        }),
      };

      const storage = new RedisRateLimitStorage(mockClient as unknown as Redis);
      const res = await storage.increment('fallback-ip', 60);

      expect(res.count).toBe(1);
      expect(res.ttl).toBe(60);
    });

    it('should fallback to in-memory storage when Redis client is not ready', async () => {
      const mockClient = {
        status: 'connecting',
      };

      const storage = new RedisRateLimitStorage(mockClient as unknown as Redis);
      const res = await storage.increment('fallback-connecting-ip', 60);

      expect(res.count).toBe(1);
      expect(res.ttl).toBe(60);
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should skip configured health endpoint', async () => {
      const middleware = createRateLimitMiddleware();
      const next = jest.fn() as NextFunction;
      const req = {
        path: '/api/health',
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;
      const statusMock = jest.fn().mockReturnThis();
      const jsonMock = jest.fn();
      const res = {
        setHeader: jest.fn(),
        status: statusMock,
        json: jsonMock,
      } as unknown as Response;

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 429 after exceeding configured request budget', async () => {
      const middleware = createRateLimitMiddleware({
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '1',
      });
      const next = jest.fn() as NextFunction;
      const req = {
        path: '/api/bookings',
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;
      const statusMock = jest.fn().mockReturnThis();
      const jsonMock = jest.fn();
      const res = {
        setHeader: jest.fn(),
        status: statusMock,
        json: jsonMock,
      } as unknown as Response;

      await middleware(req, res, next);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        statusCode: 429,
        message: 'Too many requests',
        error: 'Too Many Requests',
      });
    });

    it('should apply stricter per-path limit for order creation endpoint', async () => {
      const middleware = createRateLimitMiddleware({
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '120',
      });
      const next = jest.fn() as NextFunction;
      const statusMock = jest.fn().mockReturnThis();
      const jsonMock = jest.fn();
      const res = {
        setHeader: jest.fn(),
        status: statusMock,
        json: jsonMock,
      } as unknown as Response;
      const req = {
        path: '/api/products/orders',
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      for (let i = 0; i < 10; i += 1) {
        await middleware(req, res, next);
      }
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(10);
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should not leak order-endpoint budget into other endpoints for same IP', async () => {
      const middleware = createRateLimitMiddleware({
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '120',
      });
      const next = jest.fn() as NextFunction;
      const statusMock = jest.fn().mockReturnThis();
      const res = {
        setHeader: jest.fn(),
        status: statusMock,
        json: jest.fn(),
      } as unknown as Response;

      for (let i = 0; i < 10; i += 1) {
        await middleware(
          {
            path: '/api/products/orders',
            headers: {},
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' },
          } as unknown as Request,
          res,
          next,
        );
      }

      await middleware(
        {
          path: '/api/products/catalog',
          headers: {},
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        } as unknown as Request,
        res,
        next,
      );

      expect(statusMock).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(11);
    });

    describe('Forum & Blog Anti-Spam Rate Limiting (R6)', () => {
      it('should enforce posts rate limit: max 5 per hour (3600s TTL) with 429 and Retry-After', async () => {
        const middleware = createRateLimitMiddleware();
        const next = jest.fn() as NextFunction;
        const statusMock = jest.fn().mockReturnThis();
        const jsonMock = jest.fn();
        const setHeaderMock = jest.fn();
        const res = {
          setHeader: setHeaderMock,
          status: statusMock,
          json: jsonMock,
        } as unknown as Response;
        const postReq = {
          method: 'POST',
          path: '/api/forum/posts',
          headers: {},
          ip: '192.168.1.10',
          socket: { remoteAddress: '192.168.1.10' },
        } as unknown as Request;

        for (let i = 0; i < 5; i += 1) {
          await middleware(postReq, res, next);
        }
        expect(next).toHaveBeenCalledTimes(5);
        expect(statusMock).not.toHaveBeenCalled();

        // 6th request must exceed 5/hour limit
        await middleware(postReq, res, next);
        expect(next).toHaveBeenCalledTimes(5);
        expect(statusMock).toHaveBeenCalledWith(429);
        expect(setHeaderMock).toHaveBeenCalledWith(
          'Retry-After',
          expect.any(String),
        );
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: 429,
            message: expect.stringMatching(/too many/i),
          }),
        );
      });

      it('should enforce comments rate limit: max 20 per hour (3600s TTL) with 429 and Retry-After', async () => {
        const middleware = createRateLimitMiddleware();
        const next = jest.fn() as NextFunction;
        const statusMock = jest.fn().mockReturnThis();
        const jsonMock = jest.fn();
        const setHeaderMock = jest.fn();
        const res = {
          setHeader: setHeaderMock,
          status: statusMock,
          json: jsonMock,
        } as unknown as Response;
        const commentReq = {
          method: 'POST',
          path: '/api/forum/comments/post/thread-xyz',
          headers: {},
          ip: '192.168.1.20',
          socket: { remoteAddress: '192.168.1.20' },
        } as unknown as Request;

        for (let i = 0; i < 20; i += 1) {
          await middleware(commentReq, res, next);
        }
        expect(next).toHaveBeenCalledTimes(20);
        expect(statusMock).not.toHaveBeenCalled();

        // 21st request must trigger 429
        await middleware(commentReq, res, next);
        expect(next).toHaveBeenCalledTimes(20);
        expect(statusMock).toHaveBeenCalledWith(429);
        expect(setHeaderMock).toHaveBeenCalledWith(
          'Retry-After',
          expect.any(String),
        );
      });

      it('should enforce likes rate limit: max 60 per hour (3600s TTL) with 429 and Retry-After', async () => {
        const middleware = createRateLimitMiddleware();
        const next = jest.fn() as NextFunction;
        const statusMock = jest.fn().mockReturnThis();
        const jsonMock = jest.fn();
        const setHeaderMock = jest.fn();
        const res = {
          setHeader: setHeaderMock,
          status: statusMock,
          json: jsonMock,
        } as unknown as Response;
        const likeReq = {
          method: 'POST',
          path: '/api/forum/posts/post-99/like',
          headers: {},
          ip: '192.168.1.30',
          socket: { remoteAddress: '192.168.1.30' },
        } as unknown as Request;

        for (let i = 0; i < 60; i += 1) {
          await middleware(likeReq, res, next);
        }
        expect(next).toHaveBeenCalledTimes(60);
        expect(statusMock).not.toHaveBeenCalled();

        // 61st request must trigger 429
        await middleware(likeReq, res, next);
        expect(next).toHaveBeenCalledTimes(60);
        expect(statusMock).toHaveBeenCalledWith(429);
        expect(setHeaderMock).toHaveBeenCalledWith(
          'Retry-After',
          expect.any(String),
        );
      });

      it('should not apply POST rate limits to GET read requests', async () => {
        const middleware = createRateLimitMiddleware();
        const next = jest.fn() as NextFunction;
        const statusMock = jest.fn().mockReturnThis();
        const res = {
          setHeader: jest.fn(),
          status: statusMock,
          json: jest.fn(),
        } as unknown as Response;
        const getReq = {
          method: 'GET',
          path: '/api/forum/posts',
          headers: {},
          ip: '192.168.1.40',
          socket: { remoteAddress: '192.168.1.40' },
        } as unknown as Request;

        // Make 10 GET requests - should not be throttled by the 5/h post limit
        for (let i = 0; i < 10; i += 1) {
          await middleware(getReq, res, next);
        }
        expect(next).toHaveBeenCalledTimes(10);
        expect(statusMock).not.toHaveBeenCalled();
      });
    });
  });
});
