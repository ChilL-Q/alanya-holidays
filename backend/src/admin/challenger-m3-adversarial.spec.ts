import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ModerationAuditService } from './moderation-audit.service';
import { ModerationAuditRepository } from './moderation-audit.repository';
import { CreateAuditLogDto, GetAuditLogsQueryDto } from './dto/audit-log.dto';

import { DirectoryAdminController } from '../directory/presentation/directory-admin.controller';
import { DirectoryListingService } from '../directory/application/directory-listing.service';
import { ListingClaimService } from '../directory/application/listing-claim.service';

import { ForumModerationController } from '../forum/forum-moderation.controller';
import { ForumService } from '../forum/forum.service';

import { SupabaseService } from '../supabase/supabase.service';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLE_KEY } from '../auth/decorators/require-role.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('Challenger M3: Adversarial & Empirical Stress Suite for Audit Logging', () => {
  let moderationAuditService: ModerationAuditService;
  let moderationAuditRepo: ModerationAuditRepository;
  let directoryAdminController: DirectoryAdminController;
  let forumModerationController: ForumModerationController;
  let userRolesRepo: UserRolesRepository;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  // Supabase query builder mock state
  let mockQueryBuilder: Record<string, jest.Mock>;
  let mockSupabaseClient: { from: jest.Mock };

  const adminUser: AuthUser = {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
  };

  const mockListingService = {
    getDirectoryListingsAdmin: jest.fn().mockResolvedValue([]),
    getDirectoryListingsByStatus: jest.fn().mockResolvedValue([]),
    getPendingDirectoryListings: jest.fn().mockResolvedValue([]),
    approveDirectoryListing: jest.fn().mockResolvedValue({ success: true }),
    rejectDirectoryListing: jest.fn().mockResolvedValue({ success: true }),
    featureListing: jest.fn().mockResolvedValue({ success: true }),
    unfeatureListing: jest.fn().mockResolvedValue({ success: true }),
    verifyListing: jest.fn().mockResolvedValue({ success: true }),
    unverifyListing: jest.fn().mockResolvedValue({ success: true }),
    setListingScore: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockClaimService = {
    getListingClaims: jest.fn().mockResolvedValue([]),
    approveListingClaim: jest.fn().mockResolvedValue({ success: true }),
    rejectListingClaim: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockForumService = {
    reportContent: jest.fn().mockResolvedValue({ success: true }),
    getForumReports: jest.fn().mockResolvedValue([]),
    resolveForumReport: jest.fn().mockResolvedValue({ success: true }),
    getRemovedComments: jest.fn().mockResolvedValue([]),
  };

  const mockAdminService = {
    getEnquiries: jest.fn().mockResolvedValue([]),
    updateEnquiryStatus: jest.fn().mockResolvedValue({ success: true }),
    assignEnquiry: jest.fn().mockResolvedValue({ success: true }),
    getPlatformAnalytics: jest.fn().mockResolvedValue({ kpiSummary: {} }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'audit-mock-1',
          entity_type: 'listing',
          entity_id: 'l-1',
          action: 'approve',
          admin_id: '00000000-0000-0000-0000-000000000001',
          reason: null,
          metadata: {},
          created_at: new Date().toISOString(),
          admin: {
            id: '00000000-0000-0000-0000-000000000001',
            full_name: 'Test Admin',
            email: 'admin@test.com',
            avatar_url: null,
          },
        },
        error: null,
      }),
    };

    // Default query builder promise resolution for getAuditLogs
    mockQueryBuilder.range.mockResolvedValue({
      data: [
        {
          id: 'audit-mock-1',
          entity_type: 'listing',
          entity_id: 'l-1',
          action: 'approve',
          admin_id: '00000000-0000-0000-0000-000000000001',
          reason: null,
          metadata: {},
          created_at: new Date().toISOString(),
          admin: null,
        },
      ],
      count: 1,
      error: null,
    });

    mockSupabaseClient = {
      from: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        AdminController,
        DirectoryAdminController,
        ForumModerationController,
      ],
      providers: [
        ModerationAuditService,
        ModerationAuditRepository,
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: DirectoryListingService,
          useValue: mockListingService,
        },
        {
          provide: ListingClaimService,
          useValue: mockClaimService,
        },
        {
          provide: ForumService,
          useValue: mockForumService,
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
            getAdminClient: () => mockSupabaseClient,
          },
        },
        {
          provide: UserRolesRepository,
          useValue: {
            getRole: jest.fn().mockResolvedValue('admin'),
          },
        },
        Reflector,
        RolesGuard,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    moderationAuditService = module.get<ModerationAuditService>(
      ModerationAuditService,
    );
    moderationAuditRepo = module.get<ModerationAuditRepository>(
      ModerationAuditRepository,
    );
    directoryAdminController = module.get<DirectoryAdminController>(
      DirectoryAdminController,
    );
    forumModerationController = module.get<ForumModerationController>(
      ForumModerationController,
    );
    userRolesRepo = module.get<UserRolesRepository>(UserRolesRepository);
    reflector = module.get<Reflector>(Reflector);
    rolesGuard = new RolesGuard(reflector, userRolesRepo);
  });

  // =========================================================================
  // 1. Security & RBAC Guard Enforcement
  // =========================================================================
  describe('1. Security & Role Boundary Enforcement (401/403)', () => {
    test('AdminController is guarded with AuthGuard, RolesGuard, and RequireRole("admin")', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AdminController,
      ) as unknown[];
      expect(guards).toContain(AuthGuard);
      expect(guards).toContain(RolesGuard);

      const roles = Reflect.getMetadata(ROLE_KEY, AdminController) as string[];
      expect(roles).toEqual(['admin']);
    });

    test.each(['user', 'merchant', 'partner', 'guest', '', undefined])(
      'RolesGuard rejects non-admin role "%s" with UnauthorizedException',
      async (role) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue(role);

        const mockContext = {
          getHandler: () => AdminController.prototype.getAuditLogs,
          getClass: () => AdminController,
          switchToHttp: () => ({
            getRequest: () => ({
              user: { id: '00000000-0000-0000-0000-000000000099' },
            }),
          }),
        } as unknown as ExecutionContext;

        await expect(rolesGuard.canActivate(mockContext)).rejects.toThrow(
          UnauthorizedException,
        );
      },
    );

    test('RolesGuard rejects request with missing authenticated user id', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      const mockContext = {
        getHandler: () => AdminController.prototype.getAuditLogs,
        getClass: () => AdminController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: undefined,
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(rolesGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    test('RolesGuard permits admin user with role="admin"', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      jest.spyOn(userRolesRepo, 'getRole').mockResolvedValue('admin');

      const mockContext = {
        getHandler: () => AdminController.prototype.getAuditLogs,
        getClass: () => AdminController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '00000000-0000-0000-0000-000000000001' },
          }),
        }),
      } as unknown as ExecutionContext;

      const allowed = await rolesGuard.canActivate(mockContext);
      expect(allowed).toBe(true);
    });
  });

  // =========================================================================
  // 2. Extreme & Invalid Pagination Stress Testing
  // =========================================================================
  describe('2. Extreme & Invalid Pagination Stress Testing', () => {
    test.each([
      {
        page: 0,
        expectedPage: 1,
        limit: 20,
        expectedLimit: 20,
        expectedOffset: 0,
      },
      {
        page: -1,
        expectedPage: 1,
        limit: 20,
        expectedLimit: 20,
        expectedOffset: 0,
      },
      {
        page: -99999,
        expectedPage: 1,
        limit: 20,
        expectedLimit: 20,
        expectedOffset: 0,
      },
      {
        page: NaN,
        expectedPage: 1,
        limit: 20,
        expectedLimit: 20,
        expectedOffset: 0,
      },
      {
        page: 999999,
        expectedPage: 999999,
        limit: 20,
        expectedLimit: 20,
        expectedOffset: 999998 * 20,
      },
    ])(
      'Safely normalizes page input $page to page=$expectedPage with offset=$expectedOffset',
      async ({ page, expectedPage, limit, expectedLimit, expectedOffset }) => {
        const result = await moderationAuditRepo.getAuditLogs({
          page,
          limit,
        });

        expect(result.page).toBe(expectedPage);
        expect(result.limit).toBe(expectedLimit);
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(
          expectedOffset,
          expectedOffset + expectedLimit - 1,
        );
      },
    );

    test.each([
      { limit: 0, expectedLimit: 20, expectedOffset: 0 },
      { limit: -1, expectedLimit: 1, expectedOffset: 0 },
      { limit: -50, expectedLimit: 1, expectedOffset: 0 },
      { limit: 101, expectedLimit: 100, expectedOffset: 0 },
      { limit: 999999, expectedLimit: 100, expectedOffset: 0 },
      { limit: NaN, expectedLimit: 20, expectedOffset: 0 },
    ])(
      'Safely bounds limit input $limit to expectedLimit=$expectedLimit',
      async ({ limit, expectedLimit, expectedOffset }) => {
        const result = await moderationAuditRepo.getAuditLogs({
          page: 1,
          limit,
        });

        expect(result.limit).toBe(expectedLimit);
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(
          expectedOffset,
          expectedOffset + expectedLimit - 1,
        );
      },
    );

    test('Handles 0 total count gracefully without division by zero or NaN totalPages', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      const result = await moderationAuditRepo.getAuditLogs({
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(Number.isNaN(result.totalPages)).toBe(false);
    });

    test('Calculates totalPages correctly for non-zero count', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: [],
        count: 45,
        error: null,
      });

      const result = await moderationAuditRepo.getAuditLogs({
        page: 1,
        limit: 20,
      });

      expect(result.total).toBe(45);
      expect(result.totalPages).toBe(3); // Math.ceil(45/20) = 3
    });
  });

  // =========================================================================
  // 3. Date Boundary & Malformed Date Testing
  // =========================================================================
  describe('3. Date Boundary & Inverted Date Range Testing', () => {
    test('Correctly attaches gte and lte filters when ISO dates are provided', async () => {
      const startDate = '2026-08-01T00:00:00.000Z';
      const endDate = '2026-08-31T23:59:59.999Z';

      await moderationAuditRepo.getAuditLogs({
        startDate,
        endDate,
      });

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith(
        'created_at',
        startDate,
      );
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('created_at', endDate);
    });

    test('Handles inverted date range (startDate > endDate) without crashing', async () => {
      const startDate = '2026-12-31T23:59:59.999Z';
      const endDate = '2026-01-01T00:00:00.000Z';

      // The DB query builder will naturally receive both filters and return empty set
      mockQueryBuilder.range.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      const result = await moderationAuditRepo.getAuditLogs({
        startDate,
        endDate,
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith(
        'created_at',
        startDate,
      );
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('created_at', endDate);
    });

    test('Handles date-only string in endDate by expanding to end of day', async () => {
      await moderationAuditRepo.getAuditLogs({
        startDate: '2026-08-24',
        endDate: '2026-08-24',
      });

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith(
        'created_at',
        '2026-08-24',
      );
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith(
        'created_at',
        '2026-08-24T23:59:59.999Z',
      );
    });
  });

  // =========================================================================
  // 4. Injection Payloads & Search Special Characters
  // =========================================================================
  describe('4. Injection Payloads & Search Filter Robustness', () => {
    const injectionVectors = [
      "'; DROP TABLE moderation_audit_log; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM public.profiles --",
      '100%_discount',
      '(?=.*[a-z])^.*$',
      '<script>alert(1)</script>',
      'listing,claim,forum_report',
      'a'.repeat(2000), // very long search query
    ];

    test.each(injectionVectors)(
      'Passes search payload safely to query builder or filter: "%s"',
      async (payload) => {
        await moderationAuditRepo.getAuditLogs({
          search: payload,
        });

        const sanitized = payload.trim().replace(/[,()]/g, '');
        if (sanitized) {
          expect(mockQueryBuilder.or).toHaveBeenCalledWith(
            `entity_id.ilike.%${sanitized}%,reason.ilike.%${sanitized}%`,
          );
        }
      },
    );

    test('Filters by entity_type and action when not set to "all"', async () => {
      await moderationAuditRepo.getAuditLogs({
        entity_type: 'listing',
        action: 'approve',
        admin_id: '00000000-0000-0000-0000-000000000001',
      });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        'entity_type',
        'listing',
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('action', 'approve');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        'admin_id',
        '00000000-0000-0000-0000-000000000001',
      );
    });

    test('Does NOT apply eq filter when entity_type or action is "all"', async () => {
      await moderationAuditRepo.getAuditLogs({
        entity_type: 'all',
        action: 'all',
      });

      expect(mockQueryBuilder.eq).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 5. Persistence, Resilience & Fallback Behavior
  // =========================================================================
  describe('5. Persistence, Resilience & Fallback Behavior', () => {
    test('logAction returns synthesized fallback record when Supabase query returns error', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'relation "moderation_audit_log" does not exist' },
      });

      const entry: CreateAuditLogDto = {
        entity_type: 'listing',
        entity_id: 'list-123',
        action: 'approve',
        admin_id: '00000000-0000-0000-0000-000000000001',
        reason: 'Valid documentation',
        metadata: { score: 95 },
      };

      const result = await moderationAuditRepo.logAction(entry);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^audit-\d+$/);
      expect(result.entity_type).toBe('listing');
      expect(result.entity_id).toBe('list-123');
      expect(result.action).toBe('approve');
      expect(result.admin_id).toBe('00000000-0000-0000-0000-000000000001');
      expect(result.reason).toBe('Valid documentation');
      expect(result.metadata).toEqual({ score: 95 });
      expect(result.admin).toBeNull();
    });

    test('logAction returns synthesized fallback record when Supabase throws exception', async () => {
      mockQueryBuilder.insert.mockImplementation(() => {
        throw new Error('Database connection timeout');
      });

      const entry: CreateAuditLogDto = {
        entity_type: 'claim',
        entity_id: 'claim-456',
        action: 'reject',
        admin_id: '00000000-0000-0000-0000-000000000001',
      };

      const result = await moderationAuditRepo.logAction(entry);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^audit-\d+$/);
      expect(result.entity_type).toBe('claim');
      expect(result.action).toBe('reject');
      expect(result.reason).toBeNull();
      expect(result.metadata).toEqual({});
    });

    test('getAuditLogs returns empty fallback result when Supabase query returns error', async () => {
      mockQueryBuilder.range.mockResolvedValue({
        data: null,
        count: null,
        error: { message: 'Table offline' },
      });

      const result = await moderationAuditRepo.getAuditLogs({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    test('getAuditLogs returns empty fallback result when Supabase throws exception', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Supabase client uninitialized');
      });

      const result = await moderationAuditRepo.getAuditLogs({
        page: 2,
        limit: 15,
      });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 2,
        limit: 15,
        totalPages: 0,
      });
    });

    test('AdminController.getAuditLogs handles undefined moderationAuditService gracefully', async () => {
      const controllerWithoutAudit = new AdminController(
        mockAdminService as any,
        undefined,
      );

      const result = await controllerWithoutAudit.getAuditLogs(
        { page: 1, limit: 10 },
        adminUser,
      );

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });
  });

  // =========================================================================
  // 6. Moderation Controller Audit Hooks Verification
  // =========================================================================
  describe('6. Moderation Controller Audit Hooks Verification', () => {
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest
        .spyOn(moderationAuditService, 'logAction')
        .mockResolvedValue({
          id: 'audit-1',
          entity_type: 'listing',
          entity_id: 'l-1',
          action: 'approve',
          admin_id: adminUser.id,
          created_at: new Date().toISOString(),
        });
    });

    test('DirectoryAdminController.approveDirectoryListing triggers audit log', async () => {
      await directoryAdminController.approveDirectoryListing(
        'listing-1',
        adminUser,
      );

      expect(mockListingService.approveDirectoryListing).toHaveBeenCalledWith(
        'listing-1',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: 'listing-1',
        action: 'approve',
        admin_id: adminUser.id,
      });
    });

    test('DirectoryAdminController.rejectDirectoryListing triggers audit log with reason', async () => {
      await directoryAdminController.rejectDirectoryListing(
        'listing-2',
        'Incomplete information',
        adminUser,
      );

      expect(mockListingService.rejectDirectoryListing).toHaveBeenCalledWith(
        'listing-2',
        'Incomplete information',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: 'listing-2',
        action: 'reject',
        admin_id: adminUser.id,
        reason: 'Incomplete information',
      });
    });

    test('DirectoryAdminController.approveListingClaim triggers audit log', async () => {
      await directoryAdminController.approveListingClaim('claim-10', adminUser);

      expect(mockClaimService.approveListingClaim).toHaveBeenCalledWith(
        'claim-10',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'claim',
        entity_id: 'claim-10',
        action: 'approve',
        admin_id: adminUser.id,
      });
    });

    test('DirectoryAdminController.rejectListingClaim triggers audit log with reason', async () => {
      await directoryAdminController.rejectListingClaim(
        'claim-20',
        'Unauthorized claimant',
        adminUser,
      );

      expect(mockClaimService.rejectListingClaim).toHaveBeenCalledWith(
        'claim-20',
        'Unauthorized claimant',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'claim',
        entity_id: 'claim-20',
        action: 'reject',
        admin_id: adminUser.id,
        reason: 'Unauthorized claimant',
      });
    });

    test('DirectoryAdminController.featureListing triggers audit log', async () => {
      await directoryAdminController.featureListing('listing-3', adminUser);

      expect(mockListingService.featureListing).toHaveBeenCalledWith(
        'listing-3',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: 'listing-3',
        action: 'feature',
        admin_id: adminUser.id,
      });
    });

    test('DirectoryAdminController.unfeatureListing triggers audit log', async () => {
      await directoryAdminController.unfeatureListing('listing-4', adminUser);

      expect(mockListingService.unfeatureListing).toHaveBeenCalledWith(
        'listing-4',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: 'listing-4',
        action: 'unfeature',
        admin_id: adminUser.id,
      });
    });

    test('DirectoryAdminController.verifyListing triggers audit log', async () => {
      await directoryAdminController.verifyListing('listing-5', adminUser);

      expect(mockListingService.verifyListing).toHaveBeenCalledWith(
        'listing-5',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: 'listing-5',
        action: 'verify',
        admin_id: adminUser.id,
      });
    });

    test('DirectoryAdminController.unverifyListing triggers audit log', async () => {
      await directoryAdminController.unverifyListing('listing-6', adminUser);

      expect(mockListingService.unverifyListing).toHaveBeenCalledWith(
        'listing-6',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: 'listing-6',
        action: 'unverify',
        admin_id: adminUser.id,
      });
    });

    test('DirectoryAdminController.updateListingScore triggers audit log with score metadata', async () => {
      await directoryAdminController.updateListingScore(
        'listing-7',
        { score: 88 },
        adminUser,
      );

      expect(mockListingService.setListingScore).toHaveBeenCalledWith(
        'listing-7',
        88,
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: 'listing-7',
        action: 'update_score',
        admin_id: adminUser.id,
        metadata: { score: 88 },
      });
    });

    test('ForumModerationController.resolveForumReport triggers audit log', async () => {
      await forumModerationController.resolveForumReport(
        'report-99',
        adminUser,
      );

      expect(mockForumService.resolveForumReport).toHaveBeenCalledWith(
        'report-99',
        adminUser.id,
      );
      expect(logSpy).toHaveBeenCalledWith({
        entity_type: 'forum_report',
        entity_id: 'report-99',
        action: 'resolve',
        admin_id: adminUser.id,
      });
    });
  });

  // =========================================================================
  // 7. DTO Validation Contract Testing (class-validator)
  // =========================================================================
  describe('7. DTO Validation Contract Testing', () => {
    test('CreateAuditLogDto passes with valid payload', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        entity_type: 'listing',
        entity_id: 'list-100',
        action: 'approve',
        admin_id: '00000000-0000-0000-0000-000000000001',
        reason: 'Looks good',
        metadata: { key: 'value' },
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    test('CreateAuditLogDto fails when required fields are missing', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThanOrEqual(4);
      const propertyNames = errors.map((e) => e.property);
      expect(propertyNames).toContain('entity_type');
      expect(propertyNames).toContain('entity_id');
      expect(propertyNames).toContain('action');
      expect(propertyNames).toContain('admin_id');
    });

    test('GetAuditLogsQueryDto passes with valid query options', async () => {
      const dto = plainToInstance(GetAuditLogsQueryDto, {
        entity_type: 'listing',
        action: 'approve',
        page: 2,
        limit: 50,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    test('GetAuditLogsQueryDto rejects page < 1 and limit > 100', async () => {
      const dto = plainToInstance(GetAuditLogsQueryDto, {
        page: 0,
        limit: 101,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
      const errorMap = Object.fromEntries(
        errors.map((e) => [e.property, e.constraints]),
      );
      expect(errorMap.page?.min).toBeDefined();
      expect(errorMap.limit?.max).toBeDefined();
    });

    test('GetAuditLogsQueryDto rejects non-integer page and limit', async () => {
      const dto = plainToInstance(GetAuditLogsQueryDto, {
        page: 2.5,
        limit: 15.7,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(2);
      const errorMap = Object.fromEntries(
        errors.map((e) => [e.property, e.constraints]),
      );
      expect(errorMap.page?.isInt).toBeDefined();
      expect(errorMap.limit?.isInt).toBeDefined();
    });
  });
});
