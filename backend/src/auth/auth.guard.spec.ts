import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
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
        AuthGuard,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
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

  it('should throw UnauthorizedException if Authorization header is missing', async () => {
    const { switchToHttp } = createMockContext({});
    const context = { switchToHttp } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if header is not Bearer', async () => {
    const { switchToHttp } = createMockContext({
      authorization: 'Basic dXNlcjpwYXNz',
    });
    const context = { switchToHttp } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if Supabase returns an error or no user', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const { switchToHttp } = createMockContext({
      authorization: 'Bearer invalid-token',
    });
    const context = { switchToHttp } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockGetUser).toHaveBeenCalledWith('invalid-token');
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
