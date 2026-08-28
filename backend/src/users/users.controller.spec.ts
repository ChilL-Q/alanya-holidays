import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let mockService: jest.Mocked<Partial<UsersService>>;

  beforeEach(async () => {
    mockService = {
      getForumMembers: jest.fn().mockResolvedValue([]),
      getOnlineCount: jest.fn().mockResolvedValue(10),
      touchPresence: jest.fn().mockResolvedValue({ success: true }),
      getAllUsers: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
      getUsersByRole: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
      getUserProfile: jest.fn().mockResolvedValue({ id: 'usr-1' }),
      updateUserProfile: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
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

    controller = module.get<UsersController>(UsersController);
  });

  it('should parse limit and onlineOnly flag in getForumMembers', async () => {
    await controller.getForumMembers({ limit: 10 }, 'true');
    expect(mockService.getForumMembers).toHaveBeenCalledWith(10, true);
  });

  it('should pass req.user.id to touchPresence', async () => {
    const user: AuthUser = { id: 'usr-55' };
    await controller.touchPresence(user);
    expect(mockService.touchPresence).toHaveBeenCalledWith('usr-55');
  });

  it('should delegate getOnlineCount', async () => {
    const count = await controller.getOnlineCount();
    expect(count).toBe(10);
    expect(mockService.getOnlineCount).toHaveBeenCalled();
  });

  it('should pass pagination and req.user.id to getAllUsers', async () => {
    const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
    await controller.getAllUsers(
      Object.assign(new PaginationDto(), { page: 2, limit: 10 }),
      adminUser,
    );
    expect(mockService.getAllUsers).toHaveBeenCalledWith(2, 10, 'admin-1');
  });

  it('should pass role, pagination, and req.user.id to getUsersByRole', async () => {
    const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
    await controller.getUsersByRole(
      'business_owner',
      Object.assign(new PaginationDto(), { page: 1, limit: 20 }),
      adminUser,
    );
    expect(mockService.getUsersByRole).toHaveBeenCalledWith(
      'business_owner',
      1,
      20,
      'admin-1',
    );
  });

  it('should delegate updateUserProfile with bio and company_name', async () => {
    const user: AuthUser = { id: 'usr-55' };
    const dto = {
      full_name: 'Jane Doe',
      bio: 'Travel enthusiast',
      company_name: 'Holiday Homes LLC',
    };
    const res = await controller.updateUserProfile('usr-55', dto, user);
    expect(res).toEqual({ success: true });
    expect(mockService.updateUserProfile).toHaveBeenCalledWith(
      'usr-55',
      dto,
      'usr-55',
    );
  });
});
