import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../forum/types/forum.types';

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
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should parse limit and onlineOnly flag in getForumMembers', async () => {
    await controller.getForumMembers('10', 'true');
    expect(mockService.getForumMembers).toHaveBeenCalledWith(10, true);
  });

  it('should pass req.user.id to touchPresence', async () => {
    const req = { user: { id: 'usr-55' } } as unknown as AuthenticatedRequest;
    await controller.touchPresence(req);
    expect(mockService.touchPresence).toHaveBeenCalledWith('usr-55');
  });

  it('should delegate getUserProfile by ID', async () => {
    const res = await controller.getUserProfile('usr-55');
    expect(res).toEqual({ id: 'usr-1' });
    expect(mockService.getUserProfile).toHaveBeenCalledWith('usr-55');
  });
});
