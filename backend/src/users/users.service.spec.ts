import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRolesRepo: { getRole: jest.Mock };

  beforeEach(async () => {
    mockRepository = {
      getAllUsers: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getUserProfile: jest.fn(),
      updateUserProfile: jest.fn().mockResolvedValue({}),
      getUsersByRole: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      getForumMembers: jest.fn().mockResolvedValue([]),
      getForumPostsAuthors: jest.fn().mockResolvedValue([]),
      getOnlineCount: jest.fn().mockResolvedValue(5),
      updatePresence: jest.fn().mockResolvedValue({}),
    };
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getAllUsers', () => {
    it('should throw UnauthorizedException if requester is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(service.getAllUsers(1, 20, 'usr-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return paginated user data when requester is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getAllUsers.mockResolvedValueOnce({
        data: [{ id: 'usr-2', full_name: 'Bob' }],
        count: 1,
      });

      const res = await service.getAllUsers(1, 20, 'admin-1');

      expect(res.data).toEqual([{ id: 'usr-2', full_name: 'Bob' }]);
      expect(res.pagination.total).toBe(1);
    });
  });

  describe('updateUserProfile', () => {
    it('should strip role field if updating user is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      const res = await service.updateUserProfile(
        'usr-1',
        { full_name: 'New Name', role: 'admin' },
        'usr-1',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateUserProfile).toHaveBeenCalledWith('usr-1', {
        full_name: 'New Name',
      });
    });

    it('should preserve bio and company_name when updating profile', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      const res = await service.updateUserProfile(
        'usr-1',
        {
          full_name: 'New Name',
          bio: 'Expert local guide in Alanya',
          company_name: 'Alanya Adventures Ltd',
        },
        'usr-1',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.updateUserProfile).toHaveBeenCalledWith('usr-1', {
        full_name: 'New Name',
        bio: 'Expert local guide in Alanya',
        company_name: 'Alanya Adventures Ltd',
      });
    });
  });

  describe('getUserProfile', () => {
    it('should throw NotFoundException if profile does not exist', async () => {
      mockRepository.getUserProfile.mockResolvedValueOnce(null);

      await expect(service.getUserProfile('usr-missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
