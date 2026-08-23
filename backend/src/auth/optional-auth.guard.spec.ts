import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OptionalAuthGuard } from './optional-auth.guard';
import { AuthTokenService } from './auth-token.service';

describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;
  let mockAuthTokenService: { authenticateRequest: jest.Mock };

  beforeEach(async () => {
    mockAuthTokenService = {
      authenticateRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionalAuthGuard,
        {
          provide: AuthTokenService,
          useValue: mockAuthTokenService,
        },
      ],
    }).compile();

    guard = module.get<OptionalAuthGuard>(OptionalAuthGuard);
  });

  it('should delegate authentication to AuthTokenService with optional: true and return true', async () => {
    mockAuthTokenService.authenticateRequest.mockResolvedValue(true);
    const context = {} as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockAuthTokenService.authenticateRequest).toHaveBeenCalledWith(
      context,
      { optional: true },
    );
  });
});
