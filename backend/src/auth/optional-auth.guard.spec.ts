import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OptionalAuthGuard } from './optional-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;
  let mockSupabaseService: any;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionalAuthGuard,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    guard = module.get<OptionalAuthGuard>(OptionalAuthGuard);
  });

  const createMockContext = (headers: Record<string, string> = {}) => {
    const request: any = { headers };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
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
  });

  it('should return true and not set user if token is invalid or returns error', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const mockCtx = createMockContext({
      authorization: 'Bearer invalid-token',
    });
    const context = { switchToHttp: mockCtx.switchToHttp } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockCtx.request.user).toBeUndefined();
  });

  it('should attach user to request and return true for a valid token', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const mockCtx = createMockContext({
      authorization: 'Bearer valid-token',
    });
    const context = { switchToHttp: mockCtx.switchToHttp } as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockCtx.request.user).toEqual(mockUser);
    expect(mockGetUser).toHaveBeenCalledWith('valid-token');
  });
});
