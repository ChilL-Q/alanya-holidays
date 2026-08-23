import { Test, TestingModule } from '@nestjs/testing';
import { UsersAdminController } from './users-admin.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';

describe('UsersAdminController', () => {
  let controller: UsersAdminController;
  let mockService: Partial<Record<keyof UsersService, jest.Mock>>;

  const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };

  beforeEach(async () => {
    mockService = {
      getAllUsers: jest
        .fn()
        .mockResolvedValue({ data: [{ id: 'u1' }], pagination: { total: 1 } }),
      getUsersByRole: jest
        .fn()
        .mockResolvedValue({ data: [{ id: 'u2' }], pagination: { total: 1 } }),
      getUserProfile: jest
        .fn()
        .mockResolvedValue({ id: 'u1', email: 'user@example.com' }),
      updateUserProfile: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersAdminController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersAdminController>(UsersAdminController);
  });

  it('should be protected with AuthGuard, RolesGuard and RequireRole("admin") at class level', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, UsersAdminController);
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(RolesGuard);
    const roles = Reflect.getMetadata(ROLE_KEY, UsersAdminController);
    expect(roles).toEqual(['admin']);
  });

  it('should delegate getAllUsers when role is not provided', async () => {
    const res = await controller.getAllUsers(undefined, '2', '10', adminUser);
    expect(mockService.getAllUsers).toHaveBeenCalledWith(2, 10, 'admin-1');
    expect(res).toEqual({ data: [{ id: 'u1' }], pagination: { total: 1 } });
  });

  it('should delegate getUsersByRole when role filter is provided', async () => {
    const res = await controller.getAllUsers('host', '1', '20', adminUser);
    expect(mockService.getUsersByRole).toHaveBeenCalledWith(
      'host',
      1,
      20,
      'admin-1',
    );
    expect(res).toEqual({ data: [{ id: 'u2' }], pagination: { total: 1 } });
  });

  it('should delegate getUserProfile by id', async () => {
    const res = await controller.getUserProfile('u1');
    expect(mockService.getUserProfile).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ id: 'u1', email: 'user@example.com' });
  });

  it('should delegate updateUserStatus with updates and admin userId', async () => {
    const res = await controller.updateUserStatus(
      'u1',
      { full_name: 'Banned User' },
      adminUser,
    );
    expect(mockService.updateUserProfile).toHaveBeenCalledWith(
      'u1',
      { full_name: 'Banned User' },
      'admin-1',
    );
    expect(res).toEqual({ success: true });
  });
});
