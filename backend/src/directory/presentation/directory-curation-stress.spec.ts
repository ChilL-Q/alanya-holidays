import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DirectoryAdminController } from './directory-admin.controller';
import { DirectoryListingService } from '../application/directory-listing.service';
import { ListingClaimService } from '../application/listing-claim.service';
import { DirectoryRepository } from '../directory.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { RedisService } from '../../common/redis/redis.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { ROLE_KEY } from '../../auth/decorators/require-role.decorator';
import { AuthUser } from '../../auth/types/auth-user.interface';
import { CurateListingScoreDto } from '../dto/curate-listing.dto';

describe('Adversarial Stress Test: Directory Curation Controls (Milestone 2 Task 2.2)', () => {
  let controller: DirectoryAdminController;
  let listingService: DirectoryListingService;
  let userRolesRepo: { getRole: jest.Mock };
  let rolesGuard: RolesGuard;

  const validUuid = '11111111-1111-1111-1111-111111111111';
  const nonExistentUuid = '22222222-2222-2222-2222-222222222222';
  const malformedUuids = [
    'invalid-uuid',
    '123',
    '',
    '   ',
    '../etc/passwd',
    '11111111-1111-1111-1111-11111111111g', // 'g' is not hex
    '11111111-1111-1111-1111-111111111111; DROP TABLE listings;--',
    '<script>alert(1)</script>',
  ];

  const adminUser: AuthUser = {
    id: 'a1111111-1111-1111-1111-111111111111',
    role: 'admin',
  };
  const regularUser: AuthUser = {
    id: 'u1111111-1111-1111-1111-111111111111',
    role: 'user',
  };
  const merchantUser: AuthUser = {
    id: 'm1111111-1111-1111-1111-111111111111',
    role: 'merchant',
  };
  const moderatorUser: AuthUser = {
    id: 'o1111111-1111-1111-1111-111111111111',
    role: 'moderator',
  };

  const mockDirectoryRepository = {
    getDirectoryListingsAdmin: jest.fn(),
    getDirectoryListingsByStatus: jest.fn(),
    getPendingDirectoryListings: jest.fn(),
    updateListingStatus: jest.fn(),
    updateDirectoryListing: jest.fn(),
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
    userRolesRepo = {
      getRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryAdminController],
      providers: [
        DirectoryListingService,
        Reflector,
        RolesGuard,
        {
          provide: ListingClaimService,
          useValue: {
            getListingClaims: jest.fn(),
            approveListingClaim: jest.fn(),
            rejectListingClaim: jest.fn(),
          },
        },
        {
          provide: DirectoryRepository,
          useValue: mockDirectoryRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: userRolesRepo,
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
    listingService = module.get<DirectoryListingService>(
      DirectoryListingService,
    );
    rolesGuard = new RolesGuard(new Reflector(), userRolesRepo as any);
  });

  describe('1. Controller Metadata & Guard Enforcement Audit', () => {
    it('should have AuthGuard and RolesGuard attached to DirectoryAdminController', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        DirectoryAdminController,
      );
      expect(guards).toBeDefined();
      expect(guards).toEqual(expect.arrayContaining([AuthGuard, RolesGuard]));
    });

    it('should require role "admin" at the class level via ROLE_KEY', () => {
      const requiredRoles = Reflect.getMetadata(
        ROLE_KEY,
        DirectoryAdminController,
      );
      expect(requiredRoles).toEqual(['admin']);
    });

    it('RolesGuard should block unauthenticated request without userId', async () => {
      const mockContext = {
        getHandler: () => controller.featureListing,
        getClass: () => DirectoryAdminController,
        switchToHttp: () => ({
          getRequest: () => ({ user: undefined }),
        }),
      } as unknown as ExecutionContext;

      await expect(rolesGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('RolesGuard should block non-admin user', async () => {
      userRolesRepo.getRole.mockResolvedValue('user');
      const mockContext = {
        getHandler: () => controller.featureListing,
        getClass: () => DirectoryAdminController,
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: regularUser.id } }),
        }),
      } as unknown as ExecutionContext;

      await expect(rolesGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('RolesGuard should allow admin user', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      const mockContext = {
        getHandler: () => controller.featureListing,
        getClass: () => DirectoryAdminController,
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: adminUser.id } }),
        }),
      } as unknown as ExecutionContext;

      const allowed = await rolesGuard.canActivate(mockContext);
      expect(allowed).toBe(true);
    });
  });

  describe('2. Adversarial Input Stress: Extreme, Boundary & Malformed Scores', () => {
    const invalidScores = [
      { desc: 'negative integer', input: -1 },
      { desc: 'large negative integer', input: -99999 },
      { desc: 'negative small float', input: -0.00001 },
      { desc: 'over 100 integer', input: 101 },
      { desc: 'over 100 float', input: 100.001 },
      { desc: 'huge number', input: Number.MAX_SAFE_INTEGER },
      { desc: 'NaN', input: NaN },
      { desc: 'Infinity', input: Infinity },
      { desc: '-Infinity', input: -Infinity },
      { desc: 'string word', input: 'invalid' as unknown as number },
      { desc: 'string boolean', input: 'true' as unknown as number },
      { desc: 'null', input: null as unknown as number },
      { desc: 'undefined', input: undefined as unknown as number },
    ];

    invalidScores.forEach(({ desc, input }) => {
      it(`should reject invalid score [${desc}: ${input}] on score property with BadRequestException and NO cache invalidation`, async () => {
        userRolesRepo.getRole.mockResolvedValue('admin');
        const dto: CurateListingScoreDto = { score: input };

        await expect(
          controller.updateListingScore(validUuid, dto, adminUser),
        ).rejects.toThrow(BadRequestException);

        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).not.toHaveBeenCalled();
        expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
      });

      it(`should reject invalid score [${desc}: ${input}] on base_score property with BadRequestException and NO cache invalidation`, async () => {
        userRolesRepo.getRole.mockResolvedValue('admin');
        const dto: CurateListingScoreDto = { base_score: input };

        await expect(
          controller.updateListingScore(validUuid, dto, adminUser),
        ).rejects.toThrow(BadRequestException);

        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).not.toHaveBeenCalled();
        expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
      });
    });

    const validBoundaryScores = [
      { desc: 'minimum bound (0)', score: 0 },
      { desc: 'maximum bound (100)', score: 100 },
      { desc: 'midpoint (50)', score: 50 },
      { desc: 'floating point precision (87.5)', score: 87.5 },
      { desc: 'low boundary (0.01)', score: 0.01 },
      { desc: 'high boundary (99.99)', score: 99.99 },
    ];

    validBoundaryScores.forEach(({ desc, score }) => {
      it(`should successfully accept valid boundary score [${desc}: ${score}]`, async () => {
        userRolesRepo.getRole.mockResolvedValue('admin');
        mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
          id: validUuid,
          base_score: score,
        });

        const dto: CurateListingScoreDto = { score };
        const result = await controller.updateListingScore(
          validUuid,
          dto,
          adminUser,
        );

        expect(result).toEqual({ success: true, base_score: score });
        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).toHaveBeenCalledWith(validUuid, { base_score: score });
        expect(mockRedisService.delByPattern).toHaveBeenCalledWith(
          'directory:*',
        );
      });
    });
  });

  describe('3. Adversarial UUID & Non-Existent Entities Stress Testing', () => {
    const endpoints = [
      {
        name: 'feature',
        invoke: (id: string) => controller.featureListing(id, adminUser),
      },
      {
        name: 'unfeature',
        invoke: (id: string) => controller.unfeatureListing(id, adminUser),
      },
      {
        name: 'verify',
        invoke: (id: string) => controller.verifyListing(id, adminUser),
      },
      {
        name: 'unverify',
        invoke: (id: string) => controller.unverifyListing(id, adminUser),
      },
      {
        name: 'score',
        invoke: (id: string) =>
          controller.updateListingScore(id, { score: 75 }, adminUser),
      },
    ];

    endpoints.forEach(({ name, invoke }) => {
      describe(`Endpoint: ${name}`, () => {
        malformedUuids.forEach((malformedId) => {
          it(`should reject malformed ID [${malformedId}] with NotFoundException and never call repository update or cache invalidation`, async () => {
            userRolesRepo.getRole.mockResolvedValue('admin');

            await expect(invoke(malformedId)).rejects.toThrow(
              NotFoundException,
            );
            expect(
              mockDirectoryRepository.updateDirectoryListing,
            ).not.toHaveBeenCalled();
            expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
          });
        });

        it(`should throw NotFoundException when valid UUID does not exist in DB`, async () => {
          userRolesRepo.getRole.mockResolvedValue('admin');
          mockDirectoryRepository.updateDirectoryListing.mockResolvedValue(
            null,
          );

          await expect(invoke(nonExistentUuid)).rejects.toThrow(
            NotFoundException,
          );
          expect(
            mockDirectoryRepository.updateDirectoryListing,
          ).toHaveBeenCalled();
          expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('4. Strict Role & Authorization Perimeter Enforcement', () => {
    const nonAdminUsers = [
      { roleName: 'regular user', user: regularUser, repoRole: 'user' },
      { roleName: 'merchant user', user: merchantUser, repoRole: 'merchant' },
      {
        roleName: 'moderator user',
        user: moderatorUser,
        repoRole: 'moderator',
      },
      {
        roleName: 'unprivileged/unknown',
        user: { id: 'unknown-id', role: 'guest' } as AuthUser,
        repoRole: 'guest',
      },
    ];

    nonAdminUsers.forEach(({ roleName, user, repoRole }) => {
      it(`should reject ${roleName} on featureListing with UnauthorizedException`, async () => {
        userRolesRepo.getRole.mockResolvedValue(repoRole);
        await expect(
          controller.featureListing(validUuid, user),
        ).rejects.toThrow(UnauthorizedException);
        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).not.toHaveBeenCalled();
        expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
      });

      it(`should reject ${roleName} on unfeatureListing with UnauthorizedException`, async () => {
        userRolesRepo.getRole.mockResolvedValue(repoRole);
        await expect(
          controller.unfeatureListing(validUuid, user),
        ).rejects.toThrow(UnauthorizedException);
        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).not.toHaveBeenCalled();
        expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
      });

      it(`should reject ${roleName} on verifyListing with UnauthorizedException`, async () => {
        userRolesRepo.getRole.mockResolvedValue(repoRole);
        await expect(controller.verifyListing(validUuid, user)).rejects.toThrow(
          UnauthorizedException,
        );
        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).not.toHaveBeenCalled();
        expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
      });

      it(`should reject ${roleName} on unverifyListing with UnauthorizedException`, async () => {
        userRolesRepo.getRole.mockResolvedValue(repoRole);
        await expect(
          controller.unverifyListing(validUuid, user),
        ).rejects.toThrow(UnauthorizedException);
        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).not.toHaveBeenCalled();
        expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
      });

      it(`should reject ${roleName} on updateListingScore with UnauthorizedException`, async () => {
        userRolesRepo.getRole.mockResolvedValue(repoRole);
        await expect(
          controller.updateListingScore(validUuid, { score: 90 }, user),
        ).rejects.toThrow(UnauthorizedException);
        expect(
          mockDirectoryRepository.updateDirectoryListing,
        ).not.toHaveBeenCalled();
        expect(mockRedisService.delByPattern).not.toHaveBeenCalled();
      });
    });
  });

  describe('5. Idempotency & Repeat State Invariance', () => {
    it('featureListing should be strictly idempotent when invoked repeatedly', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: validUuid,
        is_featured: true,
      });

      for (let i = 0; i < 5; i++) {
        const result = await controller.featureListing(validUuid, adminUser);
        expect(result).toEqual({ success: true, is_featured: true });
      }

      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledTimes(5);
      expect(mockRedisService.delByPattern).toHaveBeenCalledTimes(5);
    });

    it('unfeatureListing should be strictly idempotent when invoked repeatedly', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: validUuid,
        is_featured: false,
      });

      for (let i = 0; i < 5; i++) {
        const result = await controller.unfeatureListing(validUuid, adminUser);
        expect(result).toEqual({ success: true, is_featured: false });
      }

      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledTimes(5);
      expect(mockRedisService.delByPattern).toHaveBeenCalledTimes(5);
    });

    it('verifyListing should be strictly idempotent when invoked repeatedly', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: validUuid,
        is_verified: true,
      });

      for (let i = 0; i < 5; i++) {
        const result = await controller.verifyListing(validUuid, adminUser);
        expect(result).toEqual({ success: true, is_verified: true });
      }

      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledTimes(5);
      expect(mockRedisService.delByPattern).toHaveBeenCalledTimes(5);
    });

    it('unverifyListing should be strictly idempotent when invoked repeatedly', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: validUuid,
        is_verified: false,
      });

      for (let i = 0; i < 5; i++) {
        const result = await controller.unverifyListing(validUuid, adminUser);
        expect(result).toEqual({ success: true, is_verified: false });
      }

      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledTimes(5);
      expect(mockRedisService.delByPattern).toHaveBeenCalledTimes(5);
    });

    it('setListingScore should be strictly idempotent when setting the same score', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: validUuid,
        base_score: 80,
      });

      for (let i = 0; i < 5; i++) {
        const result = await controller.updateListingScore(
          validUuid,
          { score: 80 },
          adminUser,
        );
        expect(result).toEqual({ success: true, base_score: 80 });
      }

      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledTimes(5);
      expect(mockRedisService.delByPattern).toHaveBeenCalledTimes(5);
    });
  });

  describe('6. Direct Facade Delegation Invariance', () => {
    it('should correctly initialize and delegate via DirectoryService facade if injected', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: validUuid,
        is_featured: true,
      });

      const facadeInstance = {
        listingService,
        claimService: {},
      };

      const facadeController = new DirectoryAdminController(
        facadeInstance.listingService,
        facadeInstance.claimService as any,
      );

      const result = await facadeController.featureListing(
        validUuid,
        adminUser,
      );
      expect(result).toEqual({ success: true, is_featured: true });
    });
  });
});
