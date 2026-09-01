import {
  Controller,
  Get,
  UseGuards,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from './types/auth-user.interface';
import { AuthGuard } from './auth.guard';
import { OptionalAuthGuard } from './optional-auth.guard';
import { AuthTokenService } from './auth-token.service';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../common/redis/redis.service';

@Controller('test-auth')
class TestAuthController {
  @Get('protected')
  @UseGuards(AuthGuard)
  getProtected(@CurrentUser() user: AuthUser) {
    return { status: 'authenticated', userId: user.id, email: user.email };
  }

  @Get('protected-id')
  @UseGuards(AuthGuard)
  getProtectedIdOnly(@CurrentUser('id') userId: string) {
    return { status: 'authenticated', userId };
  }

  @Get('optional')
  @UseGuards(OptionalAuthGuard)
  getOptional(@CurrentUser() user?: AuthUser) {
    if (user) {
      return { status: 'authenticated', userId: user.id };
    }
    return { status: 'anonymous', userId: null };
  }

  @Get('unguarded')
  getUnguarded(@CurrentUser() user?: AuthUser) {
    return { status: user ? 'authenticated' : 'anonymous', user };
  }
}

describe('Auth Context Adversarial & Edge-Case Suite', () => {
  let controller: TestAuthController;
  let authGuard: AuthGuard;
  let optionalGuard: OptionalAuthGuard;
  let mockGetUser: jest.Mock;
  let mockRedisGetJson: jest.Mock;
  let mockRedisSetJson: jest.Mock;

  const validToken = 'valid-jwt-token-xyz';
  const mockUser: AuthUser = {
    id: 'usr-adv-123',
    email: 'adv@alanya.test',
    role: 'authenticated',
    user_metadata: { display_name: 'Adversarial Tester' },
  };

  beforeEach(async () => {
    mockGetUser = jest.fn();
    mockRedisGetJson = jest.fn().mockResolvedValue(null);
    mockRedisSetJson = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestAuthController],
      providers: [
        AuthTokenService,
        AuthGuard,
        OptionalAuthGuard,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => ({
              auth: {
                getUser: mockGetUser,
              },
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getJson: mockRedisGetJson,
            setJson: mockRedisSetJson,
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<TestAuthController>(TestAuthController);
    authGuard = module.get<AuthGuard>(AuthGuard);
    optionalGuard = module.get<OptionalAuthGuard>(OptionalAuthGuard);
  });

  const createContext = (
    headers: Record<string, string> = {},
  ): {
    context: ExecutionContext;
    request: { headers: Record<string, string>; user?: unknown };
  } => {
    const request = { headers, user: undefined };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  describe('AuthGuard & CurrentUser Interaction', () => {
    it('should grant access and allow controller to access full AuthUser when token is valid', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { context, request } = createContext({
        authorization: `Bearer ${validToken}`,
      });

      const canActivate = await authGuard.canActivate(context);
      expect(canActivate).toBe(true);
      expect(request.user).toEqual(mockUser);

      // Now pass the attached user to controller method
      const response = controller.getProtected(request.user as AuthUser);
      expect(response).toEqual({
        status: 'authenticated',
        userId: 'usr-adv-123',
        email: 'adv@alanya.test',
      });
    });

    it('should reject with 401 UnauthorizedException when token is missing', async () => {
      const { context } = createContext({});
      await expect(authGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject with 401 UnauthorizedException when token is malformed / invalid', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Invalid token signature'),
      });

      const { context } = createContext({
        authorization: 'Bearer bad-token',
      });

      await expect(authGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('OptionalAuthGuard & CurrentUser Interaction', () => {
    it('should allow unauthenticated requests through without user, returning anonymous state', async () => {
      const { context, request } = createContext({});
      const canActivate = await optionalGuard.canActivate(context);
      expect(canActivate).toBe(true);
      expect(request.user).toBeUndefined();

      const response = controller.getOptional(
        request.user as AuthUser | undefined,
      );
      expect(response).toEqual({
        status: 'anonymous',
        userId: null,
      });
    });

    it('should allow authenticated requests through and set user when valid token provided', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { context, request } = createContext({
        authorization: `Bearer ${validToken}`,
      });

      const canActivate = await optionalGuard.canActivate(context);
      expect(canActivate).toBe(true);
      expect(request.user).toEqual(mockUser);

      const response = controller.getOptional(request.user as AuthUser);
      expect(response).toEqual({
        status: 'authenticated',
        userId: 'usr-adv-123',
      });
    });

    it('should gracefully fallback to anonymous when token is invalid in optional auth', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Expired token'),
      });

      const { context, request } = createContext({
        authorization: 'Bearer expired-token',
      });

      const canActivate = await optionalGuard.canActivate(context);
      expect(canActivate).toBe(true);
      expect(request.user).toBeUndefined();

      const response = controller.getOptional(
        request.user as AuthUser | undefined,
      );
      expect(response).toEqual({
        status: 'anonymous',
        userId: null,
      });
    });
  });

  describe('Unguarded & Edge Cases', () => {
    it('should safely execute unguarded controller routes with undefined user', () => {
      const response = controller.getUnguarded(undefined);
      expect(response).toEqual({
        status: 'anonymous',
        user: undefined,
      });
    });

    it('should support property-specific extraction in controller handler', () => {
      const response = controller.getProtectedIdOnly('usr-adv-123');
      expect(response).toEqual({
        status: 'authenticated',
        userId: 'usr-adv-123',
      });
    });
  });
});
