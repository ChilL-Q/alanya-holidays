import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { AuthTokenService } from './auth-token.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthTokenService: { authenticateRequest: jest.Mock };

  beforeEach(async () => {
    mockAuthTokenService = {
      authenticateRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: AuthTokenService,
          useValue: mockAuthTokenService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should delegate authentication to AuthTokenService with optional: false and return true on success', async () => {
    mockAuthTokenService.authenticateRequest.mockResolvedValue(true);
    const context = {} as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockAuthTokenService.authenticateRequest).toHaveBeenCalledWith(
      context,
      { optional: false },
    );
  });

  it('should propagate UnauthorizedException from AuthTokenService on failure', async () => {
    mockAuthTokenService.authenticateRequest.mockRejectedValue(
      new UnauthorizedException(),
    );
    const context = {} as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockAuthTokenService.authenticateRequest).toHaveBeenCalledWith(
      context,
      { optional: false },
    );
  });
});
