import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { DirectoryController } from '../directory/directory.controller';
import { DirectoryAdminController } from '../directory/presentation/directory-admin.controller';
import { DirectoryService } from '../directory/directory.service';
import { DirectoryListingService } from '../directory/application/directory-listing.service';
import { ListingClaimService } from '../directory/application/listing-claim.service';
import { DirectoryRepository } from '../directory/directory.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { RedisService } from '../common/redis/redis.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('Challenger M2: Adversarial & Edge Case Empirical Suite', () => {
  let adminService: AdminService;
  let adminRepo: AdminRepository;

  let _directoryController: DirectoryController;
  let directoryAdminController: DirectoryAdminController;
  let directoryService: DirectoryService;
  let _directoryRepo: DirectoryRepository;
  let userRolesRepo: UserRolesRepository;

  const mockSupabaseClient = {
    from: jest.fn(),
    rpc: jest.fn(),
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        AdminController,
        DirectoryController,
        DirectoryAdminController,
      ],
      providers: [
        AdminService,
        AdminRepository,
        DirectoryService,
        DirectoryListingService,
        ListingClaimService,
        DirectoryRepository,
        {
          provide: UserRolesRepository,
          useValue: { getRole: jest.fn() },
        },
        {
          provide: RedisService,
          useValue: mockRedis,
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
            getAdminClient: () => mockSupabaseClient,
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    adminService = module.get<AdminService>(AdminService);
    adminRepo = module.get<AdminRepository>(AdminRepository);

    _directoryController = module.get<DirectoryController>(DirectoryController);
    directoryAdminController = module.get<DirectoryAdminController>(
      DirectoryAdminController,
    );
    directoryService = module.get<DirectoryService>(DirectoryService);
    _directoryRepo = module.get<DirectoryRepository>(DirectoryRepository);
    userRolesRepo = module.get<UserRolesRepository>(UserRolesRepository);
  });

  describe('1. Security Boundary Enforcement (401/403 Rejection)', () => {
    test('AdminController class is decorated with AuthGuard, RolesGuard, and RequireRole("admin")', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AdminController,
      ) as unknown[];
      expect(guards).toContain(AuthGuard);
      expect(guards).toContain(RolesGuard);
      const roles = Reflect.getMetadata(ROLE_KEY, AdminController) as string[];
      expect(roles).toEqual(['admin']);
    });

    test('DirectoryAdminController class is decorated with AuthGuard, RolesGuard, and RequireRole("admin")', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        DirectoryAdminController,
      ) as unknown[];
      expect(guards).toContain(AuthGuard);
      expect(guards).toContain(RolesGuard);
      const roles = Reflect.getMetadata(
        ROLE_KEY,
        DirectoryAdminController,
      ) as string[];
      expect(roles).toEqual(['admin']);
    });

    const nonAdminRoles = ['user', 'merchant', 'partner', undefined, ''];

    test.each(nonAdminRoles)(
      'GET /directory/admin/listings rejects role "%s" with UnauthorizedException',
      async (role) => {
        jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue(role);

        const user: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          role,
        };

        await expect(
          directoryAdminController.getDirectoryListingsAdmin(
            'all',
            undefined,
            undefined,
            undefined,
            user,
          ),
        ).rejects.toThrow(UnauthorizedException);
      },
    );

    test.each(nonAdminRoles)(
      'POST /directory/:id/approve rejects role "%s" with UnauthorizedException',
      async (role) => {
        jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue(role);

        const user: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          role,
        };

        await expect(
          directoryAdminController.approveDirectoryListing('list-1', user),
        ).rejects.toThrow(UnauthorizedException);
      },
    );

    test.each(nonAdminRoles)(
      'POST /directory/:id/reject rejects role "%s" with UnauthorizedException',
      async (role) => {
        jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue(role);

        const user: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          role,
        };

        await expect(
          directoryAdminController.rejectDirectoryListing(
            'list-1',
            'Reason',
            user,
          ),
        ).rejects.toThrow(UnauthorizedException);
      },
    );

    test.each(nonAdminRoles)(
      'POST /directory/claims/:id/approve rejects role "%s" with UnauthorizedException',
      async (role) => {
        jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue(role);

        const user: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          role,
        };

        await expect(
          directoryAdminController.approveListingClaim('claim-1', user),
        ).rejects.toThrow(UnauthorizedException);
      },
    );

    test.each(nonAdminRoles)(
      'POST /directory/claims/:id/reject rejects role "%s" with UnauthorizedException',
      async (role) => {
        jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue(role);

        const user: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          role,
        };

        await expect(
          directoryAdminController.rejectListingClaim(
            'claim-1',
            'Invalid',
            user,
          ),
        ).rejects.toThrow(UnauthorizedException);
      },
    );

    test.each(nonAdminRoles)(
      'GET /directory/claims rejects role "%s" with UnauthorizedException',
      async (role) => {
        jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue(role);

        const user: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          role,
        };

        await expect(
          directoryAdminController.getListingClaims(user),
        ).rejects.toThrow(UnauthorizedException);
      },
    );
  });

  describe('2. Filter Matrix & SQL Injection Safety', () => {
    it('handles all 5 status filters (all, pending, approved, rejected, draft)', async () => {
      jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue('admin');

      const statuses = ['all', 'pending', 'approved', 'rejected', 'draft'];

      for (const st of statuses) {
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

        await directoryService.getDirectoryListingsAdmin(
          { status: st, category: 'all' },
          '00000000-0000-0000-0000-000000000001',
        );

        if (st !== 'all') {
          expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', st);
        }
      }
    });

    it('escapes special characters (%, _, commas) in admin search query', async () => {
      jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue('admin');

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      await directoryService.getDirectoryListingsAdmin(
        { query: '100%_pure,dining' },
        '00000000-0000-0000-0000-000000000001',
      );

      expect(mockQueryBuilder.or).toHaveBeenCalledWith(
        expect.stringContaining('100\\%\\_pure dining'),
      );
    });
  });

  describe('3. Platform Analytics Math Resilience (Zero Division & Empty State)', () => {
    it('safely handles zero clicks and zero claims without returning NaN or Infinity', async () => {
      // Mock empty DB tables
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'directory_listings') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'l1',
                  name: 'Sample',
                  status: 'approved',
                  tier: 'explorer',
                },
              ],
            }),
          };
        }
        if (table === 'listing_analytics') {
          return {
            select: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          };
        }
        if (table === 'listing_claims') {
          return {
            select: jest.fn().mockResolvedValue({ data: [] }),
          };
        }
        return { select: jest.fn().mockResolvedValue({ data: [] }) };
      });

      const result = await adminRepo.getPlatformAnalytics(30);

      expect(result.kpiSummary.totalViews).toBe(0);
      expect(result.kpiSummary.totalClicks).toBe(0);
      expect(result.kpiSummary.claimConversionRate).toBe(0);
      expect(Number.isNaN(result.kpiSummary.claimConversionRate)).toBe(false);

      for (const channel of result.channelBreakdown) {
        expect(channel.percentage).toBe(0);
        expect(Number.isNaN(channel.percentage)).toBe(false);
      }
    });

    it('safely normalizes negative or zero days to 30 days', async () => {
      const spy = jest
        .spyOn(adminRepo, 'getPlatformAnalytics')
        .mockResolvedValue({
          kpiSummary: {
            totalViews: 0,
            totalClicks: 0,
            totalWhatsAppClicks: 0,
            totalWebsiteClicks: 0,
            totalMapClicks: 0,
            activeListingsCount: 0,
            pendingListingsCount: 0,
            pendingClaimsCount: 0,
            totalClaimsCount: 0,
            approvedClaimsCount: 0,
            claimConversionRate: 0,
          },
          viewsTrend: [],
          channelBreakdown: [],
          tierDistribution: {
            explorer: 0,
            voyager: 0,
            signature: 0,
            partner: 0,
          },
          statusDistribution: {
            approved: 0,
            pending: 0,
            rejected: 0,
            draft: 0,
          },
          topListings: [],
        });

      await adminService.getPlatformAnalytics(
        -15,
        '00000000-0000-0000-0000-000000000001',
      );
      expect(spy).toHaveBeenCalledWith(30);

      await adminService.getPlatformAnalytics(
        0,
        '00000000-0000-0000-0000-000000000001',
      );
      expect(spy).toHaveBeenCalledWith(30);
    });
  });

  describe('4. Claims Queue Ownership Transfer RPC Integration', () => {
    it('properly propagates RPC failure message when claim approval fails', async () => {
      jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue('admin');
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            success: false,
            message: 'Listing already claimed by another user',
          },
        ],
        error: null,
      });

      await expect(
        directoryService.approveListingClaim(
          'claim-123',
          '00000000-0000-0000-0000-000000000001',
        ),
      ).rejects.toThrow('Listing already claimed by another user');
    });

    it('rejects listing moderation if rejection reason exceeds 1000 characters', async () => {
      jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue('admin');
      const oversizedReason = 'a'.repeat(1001);

      await expect(
        directoryService.rejectDirectoryListing(
          'list-123',
          oversizedReason,
          '00000000-0000-0000-0000-000000000001',
        ),
      ).rejects.toThrow('Rejection reason must be 1000 characters or fewer');
    });
  });
});
