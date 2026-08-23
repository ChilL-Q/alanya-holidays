import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import {
  AuthTokenService,
  AUTH_TOKEN_CACHE_TTL_SECONDS,
} from './auth-token.service';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../common/redis/redis.service';

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let mockSupabaseService: { getClient: jest.Mock };
  let mockRedisService: {
    getJson: jest.Mock;
    setJson: jest.Mock;
    del: jest.Mock;
  };
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
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenService,
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

    service = module.get<AuthTokenService>(AuthTokenService);
  });

  describe('extractTokenFromHeader', () => {
    it('should extract Bearer token from valid authorization header', () => {
      const req = {
        headers: { authorization: 'Bearer test-token-123' },
      } as unknown as Request;
      expect(service.extractTokenFromHeader(req)).toBe('test-token-123');
    });

    it('should return undefined if authorization header is missing', () => {
      const req = { headers: {} } as unknown as Request;
      expect(service.extractTokenFromHeader(req)).toBeUndefined();
    });

    it('should return undefined if header is not Bearer scheme', () => {
      const req = {
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      } as unknown as Request;
      expect(service.extractTokenFromHeader(req)).toBeUndefined();
    });

    it('should return undefined if Bearer token is empty', () => {
      const req = {
        headers: { authorization: 'Bearer ' },
      } as unknown as Request;
      expect(service.extractTokenFromHeader(req)).toBeUndefined();
    });
  });

  describe('hashToken', () => {
    it('should return correct sha256 hex digest for token', () => {
      const token = 'sample-jwt-token';
      const expected = createHash('sha256').update(token).digest('hex');
      expect(service.hashToken(token)).toBe(expected);
    });
  });

  describe('verifyToken', () => {
    it('should return user from Redis cache without calling Supabase on cache hit', async () => {
      const token = 'cached-token';
      const tokenHash = service.hashToken(token);
      const cachedUser = {
        id: 'usr-1',
        email: 'cached@example.com',
      } as unknown as User;

      mockRedisService.getJson.mockResolvedValueOnce(cachedUser);

      const user = await service.verifyToken(token);

      expect(user).toEqual(cachedUser);
      expect(mockRedisService.getJson).toHaveBeenCalledWith(
        `auth:token:${tokenHash}`,
      );
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockRedisService.setJson).not.toHaveBeenCalled();
    });

    it('should validate with Supabase, cache user in Redis, index user token, and return user on cache miss', async () => {
      const token = 'fresh-token';
      const tokenHash = service.hashToken(token);
      const mockUser = {
        id: 'usr-fresh-1',
        email: 'fresh@example.com',
      } as unknown as User;

      mockRedisService.getJson
        .mockResolvedValueOnce(null) // token cache miss
        .mockResolvedValueOnce([]); // user tokens index lookup

      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const user = await service.verifyToken(token);

      expect(user).toEqual(mockUser);
      expect(mockRedisService.getJson).toHaveBeenCalledWith(
        `auth:token:${tokenHash}`,
      );
      expect(mockGetUser).toHaveBeenCalledWith(token);
      expect(mockRedisService.setJson).toHaveBeenCalledWith(
        `auth:token:${tokenHash}`,
        mockUser,
        AUTH_TOKEN_CACHE_TTL_SECONDS,
      );
      expect(mockRedisService.setJson).toHaveBeenCalledWith(
        `auth:user-tokens:${mockUser.id}`,
        [tokenHash],
        3600,
      );
    });

    it('should return null if Supabase returns an error', async () => {
      const token = 'invalid-token';
      mockRedisService.getJson.mockResolvedValueOnce(null);
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Invalid JWT'),
      });

      const user = await service.verifyToken(token);

      expect(user).toBeNull();
      expect(mockRedisService.setJson).not.toHaveBeenCalled();
    });

    it('should return null if Supabase throws an exception', async () => {
      const token = 'failing-token';
      mockRedisService.getJson.mockResolvedValueOnce(null);
      mockGetUser.mockRejectedValueOnce(new Error('Network offline'));

      const user = await service.verifyToken(token);

      expect(user).toBeNull();
      expect(mockRedisService.setJson).not.toHaveBeenCalled();
    });
  });

  describe('invalidateToken', () => {
    it('should delete token cache key in Redis', async () => {
      const token = 'token-to-revoke';
      const tokenHash = service.hashToken(token);

      await service.invalidateToken(token);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        `auth:token:${tokenHash}`,
      );
    });
  });

  describe('invalidateUserTokens', () => {
    it('should delete all indexed tokens for a user and delete the index key', async () => {
      const userId = 'usr-to-ban';
      const hashes = ['hash-1', 'hash-2'];

      mockRedisService.getJson.mockResolvedValueOnce(hashes);

      await service.invalidateUserTokens(userId);

      expect(mockRedisService.getJson).toHaveBeenCalledWith(
        `auth:user-tokens:${userId}`,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(`auth:token:hash-1`);
      expect(mockRedisService.del).toHaveBeenCalledWith(`auth:token:hash-2`);
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `auth:user-tokens:${userId}`,
      );
    });

    it('should handle user with no indexed tokens gracefully', async () => {
      const userId = 'usr-empty';
      mockRedisService.getJson.mockResolvedValueOnce(null);

      await service.invalidateUserTokens(userId);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        `auth:user-tokens:${userId}`,
      );
    });
  });

  describe('authenticateRequest', () => {
    const createMockContext = (headers: Record<string, string> = {}) => {
      const request: { headers: Record<string, string>; user?: unknown } = {
        headers,
      };
      return {
        context: {
          switchToHttp: () => ({
            getRequest: () => request,
          }),
        } as unknown as ExecutionContext,
        request,
      };
    };

    it('should throw UnauthorizedException when token is missing and optional is false', async () => {
      const { context } = createMockContext({});
      await expect(
        service.authenticateRequest(context, { optional: false }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return true and keep user undefined when token is missing and optional is true', async () => {
      const { context, request } = createMockContext({});
      const result = await service.authenticateRequest(context, {
        optional: true,
      });
      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
    });

    it('should attach user to request and return true when valid token is provided', async () => {
      const token = 'valid-token';
      const mockUser = {
        id: 'usr-1',
        email: 'valid@example.com',
      } as unknown as User;

      mockRedisService.getJson.mockResolvedValueOnce(mockUser);

      const { context, request } = createMockContext({
        authorization: `Bearer ${token}`,
      });

      const result = await service.authenticateRequest(context, {
        optional: false,
      });

      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when token is invalid and optional is false', async () => {
      const token = 'invalid-token';
      mockRedisService.getJson.mockResolvedValueOnce(null);
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Bad token'),
      });

      const { context } = createMockContext({
        authorization: `Bearer ${token}`,
      });

      await expect(
        service.authenticateRequest(context, { optional: false }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return true and keep user undefined when token is invalid and optional is true', async () => {
      const token = 'invalid-token';
      mockRedisService.getJson.mockResolvedValueOnce(null);
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Bad token'),
      });

      const { context, request } = createMockContext({
        authorization: `Bearer ${token}`,
      });

      const result = await service.authenticateRequest(context, {
        optional: true,
      });

      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
    });
  });
});
