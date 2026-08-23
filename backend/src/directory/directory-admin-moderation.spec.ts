import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DirectoryAdminController } from './presentation/directory-admin.controller';
import { DirectoryService } from './directory.service';
import { DirectoryListingService } from './application/directory-listing.service';
import { ListingClaimService } from './application/listing-claim.service';
import { DirectoryRepository } from './directory.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { RedisService } from '../common/redis/redis.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  DirectoryListingRecord,
  DirectoryClaimRecord,
} from './types/directory.types';

describe('Directory Admin Moderation & Claims TDD Suite', () => {
  let controller: DirectoryAdminController;
  let service: DirectoryService;
  let mockUserRolesRepo: { getRole: jest.Mock };

  const mockListings: DirectoryListingRecord[] = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Sunset Restaurant & Lounge',
      slug: 'sunset-restaurant-lounge',
      category_id: 'restaurants',
      status: 'pending',
      tier: 'signature',
      created_at: '2026-08-20T10:00:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Alanya Boat Tours',
      slug: 'alanya-boat-tours',
      category_id: 'activities',
      status: 'approved',
      tier: 'voyager',
      created_at: '2026-08-19T10:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Draft Spa Center',
      slug: 'draft-spa-center',
      category_id: 'wellness',
      status: 'draft',
      tier: 'explorer',
      created_at: '2026-08-18T10:00:00Z',
    },
  ];

  const mockClaims: DirectoryClaimRecord[] = [
    {
      id: '55555555-5555-5555-5555-555555555555',
      listing_id: '22222222-2222-2222-2222-222222222222',
      user_id: 'claimant-user-1',
      email: 'owner@sunset.test',
      phone: '+90 555 111 2233',
      role: 'Owner',
      business_name: 'Sunset Restaurant & Lounge',
      contact_phone: '+90 555 111 2233',
      status: 'pending',
      directory_listing: {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Sunset Restaurant & Lounge',
        slug: 'sunset-restaurant-lounge',
        category_id: 'restaurants',
        tier: 'signature',
      },
    },
  ];

  const mockDirectoryRepository = {
    getDirectoryListingsAdmin: jest.fn(),
    getListingClaims: jest.fn(),
    callApproveListingClaimRpc: jest.fn(),
    callRejectListingClaimRpc: jest.fn(),
    updateListingStatus: jest.fn(),
    deleteDirectoryListing: jest.fn(),
    getDirectoryListingOwner: jest.fn(),
    invokeFunction: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryAdminController],
      providers: [
        DirectoryService,
        DirectoryListingService,
        ListingClaimService,
        {
          provide: DirectoryRepository,
          useValue: mockDirectoryRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: SupabaseService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DirectoryAdminController>(DirectoryAdminController);
    service = module.get<DirectoryService>(DirectoryService);
  });

  describe('DirectoryService.getDirectoryListingsAdmin', () => {
    it('should throw UnauthorizedException if non-admin calls getDirectoryListingsAdmin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('user');

      await expect(
        service.getDirectoryListingsAdmin({ status: 'all' }, 'user-uuid-1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserRolesRepo.getRole).toHaveBeenCalledWith('user-uuid-1');
      expect(
        mockDirectoryRepository.getDirectoryListingsAdmin,
      ).not.toHaveBeenCalled();
    });

    it('should query repository with filter matrix when user is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.getDirectoryListingsAdmin.mockResolvedValue(
        mockListings,
      );

      const filters = {
        status: 'pending',
        category: 'restaurants',
        query: 'sunset',
      };
      const result = await service.getDirectoryListingsAdmin(
        filters,
        'admin-uuid-1',
      );

      expect(mockUserRolesRepo.getRole).toHaveBeenCalledWith('admin-uuid-1');
      expect(
        mockDirectoryRepository.getDirectoryListingsAdmin,
      ).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(3);
    });
  });

  describe('DirectoryAdminController.getDirectoryListingsAdmin', () => {
    it('should delegate GET /directory/admin/listings with query filters to service', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.getDirectoryListingsAdmin.mockResolvedValue(
        mockListings,
      );

      const user: AuthUser = { id: 'admin-uuid-1', role: 'admin' };

      const result = await controller.getDirectoryListingsAdmin(
        'pending',
        'restaurants',
        'sunset',
        undefined,
        user,
      );

      expect(
        mockDirectoryRepository.getDirectoryListingsAdmin,
      ).toHaveBeenCalledWith({
        status: 'pending',
        category: 'restaurants',
        query: 'sunset',
      });
      expect(result).toEqual(mockListings);
    });
  });

  describe('DirectoryService.getListingClaims with enriched metadata', () => {
    it('should return claims including directory_listing metadata for admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.getListingClaims.mockResolvedValue(mockClaims);

      const result = await service.getListingClaims('admin-uuid-1');
      expect(mockDirectoryRepository.getListingClaims).toHaveBeenCalled();
      expect(result).toEqual(mockClaims);
      expect(result[0].directory_listing?.name).toBe(
        'Sunset Restaurant & Lounge',
      );
    });
  });
});
