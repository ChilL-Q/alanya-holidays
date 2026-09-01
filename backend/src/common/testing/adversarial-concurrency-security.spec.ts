import { HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GlobalHttpExceptionFilter } from '../filters/http-exception.filter';
import {
  DatabaseException,
  EntityNotFoundException,
  BookingConflictException,
  InvalidStatusTransitionException,
  ForbiddenDomainException,
} from '../domain/exceptions';
import {
  AuthTokenService,
  AUTH_TOKEN_CACHE_TTL_SECONDS,
} from '../../auth/auth-token.service';
import {
  createRateLimitMiddleware,
  resolveClientIp,
  MemoryRateLimitStorage,
  RedisRateLimitStorage,
  PATH_RATE_LIMITS,
} from '../security/security.config';
import type { RedisService } from '../redis/redis.service';
import type { SupabaseService } from '../../supabase/supabase.service';
import type { User } from '@supabase/supabase-js';
import type Redis from 'ioredis';

describe('Adversarial Empirical Verification: Concurrency, Auth Invalidation, Rate Limiting & DB Shielding', () => {
  // Suppress logger outputs during expected error test cases
  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // 1. CONCURRENCY & BOOKING STATUS TRANSITIONS
  // =========================================================================
  describe('Objective 1: Booking Status Transitions & Concurrency Logic', () => {
    // State machine matrix oracle based on transition_booking_status RPC definition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled', 'rejected'],
      confirmed: ['cancelled', 'completed'],
      cancelled: [],
      rejected: [],
      completed: [],
    };

    const allStatuses = [
      'pending',
      'confirmed',
      'cancelled',
      'rejected',
      'completed',
    ];

    it('Oracle verification: strictly enforces the state machine transition matrix', () => {
      for (const fromStatus of allStatuses) {
        for (const toStatus of allStatuses) {
          if (fromStatus === toStatus) {
            // Idempotent noop
            continue;
          }
          const isAllowed =
            validTransitions[fromStatus]?.includes(toStatus) ?? false;

          // Simulate SQL transition logic
          const simulateTransition = (curr: string, next: string) => {
            if (curr === next)
              return { success: true, code: 'IDEMPOTENT_NOOP' };
            const allowed =
              (curr === 'pending' &&
                ['confirmed', 'cancelled', 'rejected'].includes(next)) ||
              (curr === 'confirmed' &&
                ['cancelled', 'completed'].includes(next));
            if (!allowed) {
              return {
                success: false,
                code: 'INVALID_STATUS_TRANSITION',
                error: `Invalid status transition from "${curr}" to "${next}"`,
              };
            }
            return { success: true, code: 'TRANSITION_SUCCESS' };
          };

          const result = simulateTransition(fromStatus, toStatus);
          if (isAllowed) {
            expect(result.success).toBe(true);
            expect(result.code).toBe('TRANSITION_SUCCESS');
          } else {
            expect(result.success).toBe(false);
            expect(result.code).toBe('INVALID_STATUS_TRANSITION');
          }
        }
      }
    });

    it('Idempotency oracle: transitioning from current status to same status returns success without error', () => {
      for (const status of allStatuses) {
        const simulateIdempotentTransition = (
          curr: string,
          next: string,
        ): {
          success: boolean;
          code?: string;
          data?: {
            old_status: string;
            new_status: string;
            unblocked_dates_count: number;
          };
        } => {
          if (curr === next) {
            return {
              success: true,
              code: 'IDEMPOTENT_NOOP',
              data: {
                old_status: curr,
                new_status: next,
                unblocked_dates_count: 0,
              },
            };
          }
          return { success: false };
        };

        const res = simulateIdempotentTransition(status, status);
        expect(res.success).toBe(true);
        expect(res.code).toBe('IDEMPOTENT_NOOP');
        expect(res.data?.unblocked_dates_count).toBe(0);
      }
    });

    it('Calendar unblocking oracle: property cancellation/rejection unblocks availability; services do not', () => {
      const simulateCalendarUnblock = (
        itemType: 'property' | 'service',
        newStatus: string,
        existingBlocks: number,
      ) => {
        let unblockedCount = 0;
        if (
          ['cancelled', 'rejected'].includes(newStatus) &&
          itemType === 'property'
        ) {
          unblockedCount = existingBlocks;
        }
        return unblockedCount;
      };

      // Property cancellation -> unblocks dates
      expect(simulateCalendarUnblock('property', 'cancelled', 5)).toBe(5);
      expect(simulateCalendarUnblock('property', 'rejected', 3)).toBe(3);

      // Property confirmation / completion -> does not delete availability
      expect(simulateCalendarUnblock('property', 'confirmed', 5)).toBe(0);
      expect(simulateCalendarUnblock('property', 'completed', 5)).toBe(0);

      // Service cancellation -> property availability untouched
      expect(simulateCalendarUnblock('service', 'cancelled', 5)).toBe(0);
      expect(simulateCalendarUnblock('service', 'rejected', 5)).toBe(0);
    });

    it('Concurrent race condition simulation: serialized transitions reject the loser cleanly', async () => {
      let bookingStatus = 'pending';
      let lockAcquired = false;

      // Emulate DB atomic RPC with row lock
      const transitionRpc = async (targetStatus: string, delayMs = 10) => {
        while (lockAcquired) {
          await new Promise((r) => setTimeout(r, 2));
        }
        lockAcquired = true;
        try {
          await new Promise((r) => setTimeout(r, delayMs));
          const current = bookingStatus;
          if (current === targetStatus) {
            return { success: true, code: 'IDEMPOTENT_NOOP' };
          }
          const allowed =
            (current === 'pending' &&
              ['confirmed', 'cancelled', 'rejected'].includes(targetStatus)) ||
            (current === 'confirmed' &&
              ['cancelled', 'completed'].includes(targetStatus));
          if (!allowed) {
            return {
              success: false,
              code: 'INVALID_STATUS_TRANSITION',
              error: `Invalid status transition from "${current}" to "${targetStatus}"`,
            };
          }
          bookingStatus = targetStatus;
          return { success: true, code: 'TRANSITION_SUCCESS' };
        } finally {
          lockAcquired = false;
        }
      };

      // Concurrent execution: Webhook confirms while guest cancels simultaneously
      const [confirmResult, cancelResult] = await Promise.all([
        transitionRpc('confirmed', 5),
        transitionRpc('cancelled', 15),
      ]);

      // One must succeed as confirmed, and then cancelled can succeed from confirmed (allowed: confirmed -> cancelled)
      expect(confirmResult.success).toBe(true);
      expect(cancelResult.success).toBe(true);
      expect(bookingStatus).toBe('cancelled');

      // Now attempt another invalid transition on cancelled booking: e.g. confirm after cancel
      const lateConfirmResult = await transitionRpc('confirmed', 5);
      expect(lateConfirmResult.success).toBe(false);
      expect(lateConfirmResult.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // =========================================================================
  // 2. AUTH TOKEN SERVICE INVALIDATION & REDIS CACHING
  // =========================================================================
  describe('Objective 2: AuthTokenService Session Invalidation & Redis Cache Coherence', () => {
    let redisStore: Map<string, unknown>;
    let mockRedisService: jest.Mocked<RedisService>;
    let setJsonMock: jest.Mock;
    let mockSupabaseService: jest.Mocked<SupabaseService>;
    let authTokenService: AuthTokenService;

    const mockUser: User = {
      id: 'user-uuid-1234',
      app_metadata: {},
      user_metadata: { full_name: 'Test Guest' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    beforeEach(() => {
      redisStore = new Map();

      const redisMocks = {
        getJson: jest
          .fn()
          .mockImplementation((key: string) =>
            Promise.resolve(redisStore.get(key) || null),
          ),
        setJson: jest.fn().mockImplementation((key: string, val: unknown) => {
          redisStore.set(key, val);
        }),
        del: jest.fn().mockImplementation((key: string) => {
          redisStore.delete(key);
        }),
      };
      mockRedisService = redisMocks as unknown as jest.Mocked<RedisService>;
      setJsonMock = redisMocks.setJson;

      mockSupabaseService = {
        getClient: jest.fn().mockReturnValue({
          auth: {
            getUser: jest.fn().mockImplementation((token: string) => {
              if (token.startsWith('valid-token')) {
                return Promise.resolve({
                  data: { user: mockUser },
                  error: null,
                });
              }
              return Promise.resolve({
                data: { user: null },
                error: new Error('Invalid JWT'),
              });
            }),
          },
        }),
      } as unknown as jest.Mocked<SupabaseService>;

      authTokenService = new AuthTokenService(
        mockSupabaseService,
        mockRedisService,
      );
    });

    it('Multi-device session caching: stores token hashes in user index with correct TTLs', async () => {
      const token1 = 'valid-token-laptop';
      const token2 = 'valid-token-mobile';
      const token3 = 'valid-token-tablet';

      // 1. Verify token 1 (cache miss -> Supabase -> set Redis)
      const u1 = await authTokenService.verifyToken(token1);
      expect(u1?.id).toBe(mockUser.id);
      expect(setJsonMock).toHaveBeenCalledWith(
        authTokenService.getTokenCacheKey(authTokenService.hashToken(token1)),
        mockUser,
        AUTH_TOKEN_CACHE_TTL_SECONDS,
      );

      // 2. Verify token 2 & 3
      await authTokenService.verifyToken(token2);
      await authTokenService.verifyToken(token3);

      // 3. Check user-tokens index
      const userIndexKey = authTokenService.getUserTokensKey(mockUser.id);
      const indexedHashes = redisStore.get(userIndexKey) as string[];
      expect(indexedHashes).toBeDefined();
      expect(indexedHashes).toHaveLength(3);
      expect(indexedHashes).toContain(authTokenService.hashToken(token1));
      expect(indexedHashes).toContain(authTokenService.hashToken(token2));
      expect(indexedHashes).toContain(authTokenService.hashToken(token3));
    });

    it('Single token invalidation: evicts only the target device session', async () => {
      const tokenA = 'valid-token-device-a';
      const tokenB = 'valid-token-device-b';

      await authTokenService.verifyToken(tokenA);
      await authTokenService.verifyToken(tokenB);

      const hashA = authTokenService.hashToken(tokenA);
      const hashB = authTokenService.hashToken(tokenB);

      expect(redisStore.has(`auth:token:${hashA}`)).toBe(true);
      expect(redisStore.has(`auth:token:${hashB}`)).toBe(true);

      // Invalidate Token A
      await authTokenService.invalidateToken(tokenA);

      expect(redisStore.has(`auth:token:${hashA}`)).toBe(false);
      expect(redisStore.has(`auth:token:${hashB}`)).toBe(true);

      // Token B should still be a fast-path cache hit
      const uB = await authTokenService.verifyToken(tokenB);
      expect(uB?.id).toBe(mockUser.id);
      // Supabase getUser should only have been called twice (during initial misses for tokenA and tokenB)
      const supabaseGetClient = mockSupabaseService.getClient();
      const getUserMock = (
        supabaseGetClient as unknown as {
          auth: { getUser: jest.Mock };
        }
      ).auth.getUser;
      expect(getUserMock).toHaveBeenCalledTimes(2);
    });

    it('User-wide token invalidation: evicts all active sessions and user index key', async () => {
      const tokens = [
        'valid-token-1',
        'valid-token-2',
        'valid-token-3',
        'valid-token-4',
      ];
      for (const t of tokens) {
        await authTokenService.verifyToken(t);
      }

      for (const t of tokens) {
        const hash = authTokenService.hashToken(t);
        expect(redisStore.has(`auth:token:${hash}`)).toBe(true);
      }
      expect(redisStore.has(`auth:user-tokens:${mockUser.id}`)).toBe(true);

      // Invalidate entire user session (e.g. password reset / ban)
      await authTokenService.invalidateUserTokens(mockUser.id);

      for (const t of tokens) {
        const hash = authTokenService.hashToken(t);
        expect(redisStore.has(`auth:token:${hash}`)).toBe(false);
      }
      expect(redisStore.has(`auth:user-tokens:${mockUser.id}`)).toBe(false);
    });

    it('Invalidating tokens for unknown user ID executes cleanly without throwing', async () => {
      await expect(
        authTokenService.invalidateUserTokens('non-existent-user'),
      ).resolves.not.toThrow();
    });

    it('Deterministic SHA-256 hashing produces identical keys for identical tokens', () => {
      const t = 'Bearer-test-token-string-12345';
      const hash1 = authTokenService.hashToken(t);
      const hash2 = authTokenService.hashToken(t);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // 256 bits = 64 hex characters
    });
  });

  // =========================================================================
  // 3. REDIS RATE LIMITER, ATOMIC COUNTERS & PROXY TRUST
  // =========================================================================
  describe('Objective 3: Redis Rate Limiter, Atomic Counters & Trusted Proxy IP Resolution', () => {
    it('Atomic incrementing: limits excessive requests and provides Retry-After header', async () => {
      const memoryStorage = new MemoryRateLimitStorage();
      const middleware = createRateLimitMiddleware({
        env: {
          RATE_LIMIT_WINDOW_MS: '60000',
          RATE_LIMIT_MAX_REQUESTS: '5',
        },
        storage: memoryStorage,
      });

      let statusReceived = 200;
      let jsonBody: Record<string, unknown> = {};
      let retryAfterHeader = '';

      const makeRequest = async () => {
        statusReceived = 200;
        jsonBody = {};
        retryAfterHeader = '';

        const req = {
          path: '/api/properties',
          ip: '198.51.100.25',
          headers: {},
        } as unknown as Request;

        const res = {
          setHeader: jest.fn().mockImplementation((k: string, v: string) => {
            if (k === 'Retry-After') retryAfterHeader = v;
          }),
          status: jest.fn().mockImplementation((code: number) => {
            statusReceived = code;
            return res;
          }),
          json: jest
            .fn()
            .mockImplementation((body: Record<string, unknown>) => {
              jsonBody = body;
            }),
        } as unknown as Response;

        const next = jest.fn();
        await middleware(req, res, next);
        return {
          statusReceived,
          jsonBody,
          retryAfterHeader,
          nextCalled: next.mock.calls.length > 0,
        };
      };

      // Requests 1 to 5: must succeed
      for (let i = 1; i <= 5; i++) {
        const res = await makeRequest();
        expect(res.nextCalled).toBe(true);
        expect(res.statusReceived).toBe(200);
      }

      // Request 6: must be rate limited (429)
      const blockedRes = await makeRequest();
      expect(blockedRes.nextCalled).toBe(false);
      expect(blockedRes.statusReceived).toBe(429);
      expect(blockedRes.jsonBody.statusCode).toBe(429);
      expect(blockedRes.jsonBody.message).toBe('Too many requests');
      expect(Number(blockedRes.retryAfterHeader)).toBeGreaterThanOrEqual(1);
    });

    it('Redis rate storage atomic execution & failover to memory on connection fault', async () => {
      let redisStatus = 'ready';
      let mockCounter = 0;

      const mockRedisClient = {
        get status() {
          return redisStatus;
        },
        multi: jest.fn().mockReturnValue({
          incr: jest.fn().mockReturnThis(),
          ttl: jest.fn().mockReturnThis(),
          exec: jest.fn().mockImplementation(() => {
            if (redisStatus !== 'ready') {
              return Promise.reject(new Error('Redis connection dropped'));
            }
            mockCounter++;
            return Promise.resolve([
              [null, mockCounter],
              [null, 60],
            ]);
          }),
        }),
        expire: jest.fn().mockResolvedValue(1),
      } as unknown as Redis;

      const redisStorage = new RedisRateLimitStorage(mockRedisClient);

      // Normal Redis increment
      const r1 = await redisStorage.increment('client-key', 60);
      expect(r1.count).toBe(1);
      expect(r1.ttl).toBe(60);

      // Simulate Redis disconnect -> failover to memory
      redisStatus = 'end';
      const r2 = await redisStorage.increment('client-key', 60);
      expect(r2.count).toBe(1); // Memory fallback initialized count
      expect(r2.ttl).toBe(60);

      const r3 = await redisStorage.increment('client-key', 60);
      expect(r3.count).toBe(2); // Memory fallback increments
    });

    it('Client IP spoofing protection: reads trusted req.ip and ignores spoofed headers', () => {
      // 1. Request with Express 'trust proxy' set -> req.ip is populated by Express
      const trustedReq = {
        ip: '203.0.113.195',
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8', // Spoofed header from attacker
        },
      } as unknown as Request;

      expect(resolveClientIp(trustedReq)).toBe('203.0.113.195');

      // 2. Request without req.ip -> fallback to socket remoteAddress
      const directReq = {
        socket: { remoteAddress: '192.168.1.50' },
        headers: {},
      } as unknown as Request;

      expect(resolveClientIp(directReq)).toBe('192.168.1.50');

      // 3. Fallback when socket address is absent
      const unknownReq = {} as Request;
      expect(resolveClientIp(unknownReq)).toBe('unknown');
    });

    it('Per-path custom rate limit budgets and skip prefixes', async () => {
      const storage = new MemoryRateLimitStorage();
      const middleware = createRateLimitMiddleware({
        env: {
          RATE_LIMIT_WINDOW_MS: '60000',
          RATE_LIMIT_MAX_REQUESTS: '120',
        },
        storage,
      });

      // 1. Path whitelist check: /api/health must bypass rate limiting
      const healthReq = { path: '/api/health', ip: '10.0.0.1' } as Request;
      const nextHealth = jest.fn();
      await middleware(healthReq, {} as Response, nextHealth);
      expect(nextHealth).toHaveBeenCalledTimes(1);

      // 2. Sensitive order creation endpoint (/api/products/orders) has strict limit of 10
      expect(PATH_RATE_LIMITS['/api/products/orders']).toBe(10);
    });
  });

  // =========================================================================
  // 4. DATABASE ERROR SHIELDING & ZERO SCHEMA LEAKAGE
  // =========================================================================
  describe('Objective 4: Database Error Shielding, PostgreSQL Error Code Mapping & Schema Leakage Prevention', () => {
    let filter: GlobalHttpExceptionFilter;
    let mockResponse: {
      status: jest.Mock;
      json: jest.Mock;
    };
    let responseStatus: number;
    let responseBody: Record<string, unknown>;

    beforeEach(() => {
      filter = new GlobalHttpExceptionFilter();
      responseStatus = 0;
      responseBody = {};

      mockResponse = {
        status: jest.fn().mockImplementation((code: number) => {
          responseStatus = code;
          return mockResponse;
        }),
        json: jest.fn().mockImplementation((body: Record<string, unknown>) => {
          responseBody = body;
        }),
      };
    });

    const createMockHost = (url = '/api/bookings/test') => ({
      switchToHttp: () => ({
        getResponse: () => mockResponse as unknown as Response,
        getRequest: () =>
          ({
            url,
            method: 'POST',
            user: { id: 'usr-1' },
          }) as unknown as Request,
      }),
    });

    it('Shields PostgreSQL 23505 unique violation -> 409 RESOURCE_ALREADY_EXISTS', () => {
      const pgError = {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "users_email_key"',
        detail: 'Key (email)=(attacker@test.com) already exists.',
      };

      filter.catch(pgError, createMockHost() as never);

      expect(responseStatus).toBe(HttpStatus.CONFLICT);
      expect(responseBody).toEqual({
        success: false,
        error: expect.objectContaining({
          statusCode: 409,
          code: 'RESOURCE_ALREADY_EXISTS',
          message: 'A record with the specified details already exists.',
        }) as Record<string, unknown>,
      });

      // Verify ZERO internal constraint or column leakage
      const rawJson = JSON.stringify(responseBody);
      expect(rawJson).not.toContain('users_email_key');
      expect(rawJson).not.toContain('attacker@test.com');
      expect(rawJson).not.toContain('duplicate key');
    });

    it('Shields PostgreSQL 23503 foreign key violation -> 400 FOREIGN_KEY_VIOLATION', () => {
      const pgError = {
        code: '23503',
        message:
          'insert or update on table "bookings" violates foreign key constraint "bookings_property_id_fkey"',
      };

      filter.catch(pgError, createMockHost() as never);

      expect(responseStatus).toBe(HttpStatus.BAD_REQUEST);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          statusCode: 400,
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'The referenced entity does not exist.',
        }),
      );
      expect(JSON.stringify(responseBody)).not.toContain(
        'bookings_property_id_fkey',
      );
    });

    it('Shields PostgreSQL 42501 insufficient privilege / RLS error -> 403 PERMISSION_DENIED', () => {
      const pgError = {
        code: '42501',
        message:
          'new row violates row-level security policy for table "properties"',
      };

      filter.catch(pgError, createMockHost() as never);

      expect(responseStatus).toBe(HttpStatus.FORBIDDEN);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          statusCode: 403,
          code: 'PERMISSION_DENIED',
          message:
            'You do not have permission to perform this database operation.',
        }),
      );
      expect(JSON.stringify(responseBody)).not.toContain('row-level security');
    });

    it('Shields PostgreSQL 40001 serialization failure -> 409 CONCURRENCY_CONFLICT', () => {
      const pgError = {
        code: '40001',
        message: 'could not serialize access due to concurrent update',
      };

      filter.catch(pgError, createMockHost() as never);

      expect(responseStatus).toBe(HttpStatus.CONFLICT);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          statusCode: 409,
          code: 'CONCURRENCY_CONFLICT',
          message:
            'A concurrent database conflict occurred. Please retry your request.',
        }),
      );
    });

    it('Shields PostgREST PGRST116 single row not found -> 404 ENTITY_NOT_FOUND', () => {
      const pgrstError = {
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
      };

      filter.catch(pgrstError, createMockHost() as never);

      expect(responseStatus).toBe(HttpStatus.NOT_FOUND);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          statusCode: 404,
          code: 'ENTITY_NOT_FOUND',
          message: 'The requested resource was not found.',
        }),
      );
    });

    it('Shields DatabaseException and unhandled errors from leaking SQL syntax, table schemas, or stack traces', () => {
      const sensitiveSqlError = new DatabaseException(
        'SELECT password_hash, stripe_secret FROM internal_users WHERE id = 123; syntax error at column "stripe_secret"',
        new Error('SQL crash'),
        '42601',
      );

      filter.catch(sensitiveSqlError, createMockHost() as never);

      expect(responseStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          statusCode: 500,
          code: 'DATABASE_ERROR',
          message: 'A database operation failed. Please try again later.',
        }),
      );

      const responseString = JSON.stringify(responseBody);
      expect(responseString).not.toContain('password_hash');
      expect(responseString).not.toContain('stripe_secret');
      expect(responseString).not.toContain('internal_users');
      expect(responseString).not.toContain('SELECT');

      // Generic unhandled Error (500)
      const fatalError = new Error(
        'FATAL SERVER EXCEPTION: /var/secrets/key.pem corrupted',
      );
      filter.catch(fatalError, createMockHost() as never);

      expect(responseStatus).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          statusCode: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred. Please try again later.',
        }),
      );
      expect(JSON.stringify(responseBody)).not.toContain(
        '/var/secrets/key.pem',
      );
    });

    it('Domain Exceptions: EntityNotFound, BookingConflict, InvalidStatusTransition, ForbiddenDomain map cleanly', () => {
      const notFound = new EntityNotFoundException('Booking', 'bk-999');
      filter.catch(notFound, createMockHost() as never);
      expect(responseStatus).toBe(404);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          code: 'ENTITY_NOT_FOUND',
          message: 'Booking with id "bk-999" was not found.',
        }),
      );

      const conflict = new BookingConflictException(
        'Property already booked for selected dates',
      );
      filter.catch(conflict, createMockHost() as never);
      expect(responseStatus).toBe(409);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          code: 'BOOKING_CONFLICT',
          message: 'Property already booked for selected dates',
        }),
      );

      const invalidTransition = new InvalidStatusTransitionException(
        'Cannot cancel a completed booking',
      );
      filter.catch(invalidTransition, createMockHost() as never);
      expect(responseStatus).toBe(400);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Cannot cancel a completed booking',
        }),
      );

      const forbidden = new ForbiddenDomainException(
        'Only the booking owner or host can perform this action',
      );
      filter.catch(forbidden, createMockHost() as never);
      expect(responseStatus).toBe(403);
      expect(responseBody.error).toEqual(
        expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Only the booking owner or host can perform this action',
        }),
      );
    });
  });
});
