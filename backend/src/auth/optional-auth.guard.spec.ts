import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';
import { OptionalAuthGuard } from './optional-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../common/redis/redis.service';

describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;
  let mockSupabaseService: { getClient: jest.Mock };
  let mockRedisService: { getJson: jest.Mock; setJson: jest.Mock };
  let mockGetUser: jest.Mock;

  beforeEach(async () => {
    mockGetUser = jest.fn();
    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue({
        auth: {
          getUser: mockGetUser,
        },
      }),
    };

    mockRedisService = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionalAuthGuard,
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

    guard = module.get<OptionalAuthGuard>(OptionalAuthGuard);
  });

  interface MockRequest {
    headers: Record<string, string>;
    user?: unknown;
  }

  const createMockContext = (headers: Record<string, string> = {}) => {
    const request: MockRequest = { headers };
    return {
      switchToHttp: () => ({
        getRequest: (): MockRequest => request,
      }),
      request,
    };
  };

  it('should return true and not set user if Authorization header is missing', async () => {
    const mockCtx = createMockContext({});
    const context = { switchToHttp: mockCtx.switchToHttp } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockCtx.request.user).toBeUndefined();
    expect(mockRedisService.getJson).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('should return true and attach user from Redis cache on cache hit without calling Supabase', async () => {
    const token = 'cached-token-123';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const cachedUser = { id: 'cached-user-1', email: 'cached@example.com' };

    mockRedisService.getJson.mockImplementation((key: string) => {
      if (key === `auth:token:${tokenHash}`) {
        return Promise.resolve(cachedUser);
      }
      return Promise.resolve(null);
    });

    const mockCtx = createMockContext({
      authorization: `Bearer ${token}`,
    });
    const context = { switchToHttp: mockCtx.switchToHttp } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockCtx.request.user).toEqual(cachedUser);
    expect(mockRedisService.getJson).toHaveBeenCalledWith(
      `auth:token:${tokenHash}`,
    );
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockRedisService.setJson).not.toHaveBeenCalled();
  });

  it('should validate with Supabase, cache in Redis for 60s, attach user, and return true on cache miss', async () => {
    const token = 'fresh-token-456';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockRedisService.getJson.mockResolvedValue(null);
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const mockCtx = createMockContext({
      authorization: `Bearer ${token}`,
    });
    const context = { switchToHttp: mockCtx.switchToHttp } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockCtx.request.user).toEqual(mockUser);
    expect(mockRedisService.getJson).toHaveBeenCalledWith(
      `auth:token:${tokenHash}`,
    );
    expect(mockGetUser).toHaveBeenCalledWith(token);
    expect(mockRedisService.setJson).toHaveBeenCalledWith(
      `auth:token:${tokenHash}`,
      mockUser,
      60,
    );
  });

  it('should return true and not set user if token is invalid or returns error', async () => {
    const token = 'invalid-token';
    const tokenHash = createHash('sha256').update(token).digest('hex');

    mockRedisService.getJson.mockResolvedValue(null);
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const mockCtx = createMockContext({
      authorization: `Bearer ${token}`,
    });
    const context = { switchToHttp: mockCtx.switchToHttp } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockCtx.request.user).toBeUndefined();
    expect(mockRedisService.getJson).toHaveBeenCalledWith(
      `auth:token:${tokenHash}`,
    );
    expect(mockGetUser).toHaveBeenCalledWith(token);
    expect(mockRedisService.setJson).not.toHaveBeenCalled();
  });

  it('should safely return true and not set user if Supabase throws an exception', async () => {
    const token = 'throwing-token';
    const tokenHash = createHash('sha256').update(token).digest('hex');

    mockRedisService.getJson.mockResolvedValue(null);
    mockGetUser.mockRejectedValueOnce(new Error('Network error'));

    const mockCtx = createMockContext({
      authorization: `Bearer ${token}`,
    });
    const context = { switchToHttp: mockCtx.switchToHttp } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockCtx.request.user).toBeUndefined();
    expect(mockRedisService.getJson).toHaveBeenCalledWith(
      `auth:token:${tokenHash}`,
    );
    expect(mockGetUser).toHaveBeenCalledWith(token);
  });
});
