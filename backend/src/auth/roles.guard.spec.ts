import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

/**
 * Adversarial tests for the centralised admin authorization guard (audit 1.2).
 * The guard must resolve the role from the DB (not client-supplied data) and
 * deny access unless the user has the required role.
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let userRoles: { getRole: jest.Mock };

  const createContext = (userId?: string): ExecutionContext => {
    const request: Record<string, unknown> = userId
      ? { user: { id: userId } }
      : {};
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn().constructor,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    userRoles = { getRole: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        Reflector,
        { provide: UserRolesRepository, useValue: userRoles },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    // By default every test route declares an admin requirement.
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
  });

  it('should allow a DB-confirmed admin', async () => {
    userRoles.getRole.mockResolvedValueOnce('admin');

    await expect(guard.canActivate(createContext('admin-uuid'))).resolves.toBe(
      true,
    );
    expect(userRoles.getRole).toHaveBeenCalledWith('admin-uuid');
  });

  it('should reject a regular user with UnauthorizedException', async () => {
    userRoles.getRole.mockResolvedValueOnce('user');

    await expect(
      guard.canActivate(createContext('regular-uuid')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject when there is no authenticated user on the request', async () => {
    await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(userRoles.getRole).not.toHaveBeenCalled();
  });

  it('should reject when the role cannot be resolved from the DB (fail-closed)', async () => {
    userRoles.getRole.mockResolvedValueOnce(undefined);

    await expect(
      guard.canActivate(createContext('unknown-uuid')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should not double-check the DB when no role requirement is declared on the route', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(undefined);

    await expect(guard.canActivate(createContext('some-user'))).resolves.toBe(
      true,
    );
    expect(userRoles.getRole).not.toHaveBeenCalled();
  });
});
