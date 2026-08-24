import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DirectoryAdminController } from './directory-admin.controller';
import { DirectoryListingService } from '../application/directory-listing.service';
import { ListingClaimService } from '../application/listing-claim.service';
import { DirectoryRepository } from '../directory.repository';
import { ModerationAuditService } from '../../admin/moderation-audit.service';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { RedisService } from '../../common/redis/redis.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { AuthUser } from '../../auth/types/auth-user.interface';
import { CurateListingScoreDto } from '../dto/curate-listing.dto';

describe('DirectoryAdminController Curation Controls (Task 2.2)', () => {
  let controller: DirectoryAdminController;
  let userRolesRepo: { getRole: jest.Mock };
  let mockAuditService: { logAction: jest.Mock };

  const listingId = '11111111-1111-1111-1111-111111111111';
  const adminUser: AuthUser = { id: 'admin-user-uuid', role: 'admin' };
  const regularUser: AuthUser = { id: 'regular-user-uuid', role: 'user' };

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
    mockAuditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryAdminController],
      providers: [
        DirectoryListingService,
        {
          provide: ListingClaimService,
          useValue: {
            getListingClaims: jest.fn(),
            approveListingClaim: jest.fn().mockResolvedValue({ success: true }),
            rejectListingClaim: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: DirectoryRepository,
          useValue: mockDirectoryRepository,
        },
        {
          provide: ModerationAuditService,
          useValue: mockAuditService,
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
  });

  describe('Feature & Unfeature Curation Controls', () => {
    it('POST /directory/:id/feature should set is_featured to true, invalidate cache and return success', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: listingId,
        name: 'Sunset Restaurant',
        is_featured: true,
      });

      const result = await controller.featureListing(listingId, adminUser);

      expect(result).toEqual({ success: true, is_featured: true });
      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledWith(listingId, { is_featured: true });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('directory:*');
    });

    it('POST /directory/:id/unfeature should set is_featured to false, invalidate cache and return success', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: listingId,
        name: 'Sunset Restaurant',
        is_featured: false,
      });

      const result = await controller.unfeatureListing(listingId, adminUser);

      expect(result).toEqual({ success: true, is_featured: false });
      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledWith(listingId, { is_featured: false });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('directory:*');
    });

    it('should throw UnauthorizedException if non-admin attempts to feature', async () => {
      userRolesRepo.getRole.mockResolvedValue('user');

      await expect(
        controller.featureListing(listingId, regularUser),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if listing to feature does not exist', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue(null);

      await expect(
        controller.featureListing(listingId, adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Verify & Unverify Curation Controls', () => {
    it('POST /directory/:id/verify should set is_verified to true, invalidate cache and return success', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: listingId,
        name: 'Sunset Restaurant',
        is_verified: true,
      });

      const result = await controller.verifyListing(listingId, adminUser);

      expect(result).toEqual({ success: true, is_verified: true });
      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledWith(listingId, { is_verified: true });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('directory:*');
    });

    it('POST /directory/:id/unverify should set is_verified to false, invalidate cache and return success', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: listingId,
        name: 'Sunset Restaurant',
        is_verified: false,
      });

      const result = await controller.unverifyListing(listingId, adminUser);

      expect(result).toEqual({ success: true, is_verified: false });
      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledWith(listingId, { is_verified: false });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('directory:*');
    });

    it('should throw UnauthorizedException if non-admin attempts to verify', async () => {
      userRolesRepo.getRole.mockResolvedValue('user');

      await expect(
        controller.verifyListing(listingId, regularUser),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if listing to verify does not exist', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue(null);

      await expect(
        controller.verifyListing(listingId, adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Score Adjustment Curation Controls', () => {
    it('POST /directory/:id/score with score property should update base_score, invalidate cache and return base_score', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: listingId,
        name: 'Sunset Restaurant',
        base_score: 85,
      });

      const dto: CurateListingScoreDto = { score: 85 };
      const result = await controller.updateListingScore(
        listingId,
        dto,
        adminUser,
      );

      expect(result).toEqual({ success: true, base_score: 85 });
      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledWith(listingId, { base_score: 85 });
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('directory:*');
    });

    it('POST /directory/:id/score with base_score property should update base_score', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue({
        id: listingId,
        name: 'Sunset Restaurant',
        base_score: 95,
      });

      const dto: CurateListingScoreDto = { base_score: 95 };
      const result = await controller.updateListingScore(
        listingId,
        dto,
        adminUser,
      );

      expect(result).toEqual({ success: true, base_score: 95 });
      expect(
        mockDirectoryRepository.updateDirectoryListing,
      ).toHaveBeenCalledWith(listingId, { base_score: 95 });
    });

    it('should throw BadRequestException if score is negative or exceeds 100 or is missing', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');

      const invalidDto: CurateListingScoreDto = { score: -10 };
      await expect(
        controller.updateListingScore(listingId, invalidDto, adminUser),
      ).rejects.toThrow(BadRequestException);

      const invalidDto2: CurateListingScoreDto = { score: 150 };
      await expect(
        controller.updateListingScore(listingId, invalidDto2, adminUser),
      ).rejects.toThrow(BadRequestException);

      const emptyDto: CurateListingScoreDto = {};
      await expect(
        controller.updateListingScore(listingId, emptyDto, adminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if listing to score does not exist', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateDirectoryListing.mockResolvedValue(null);

      const dto: CurateListingScoreDto = { score: 50 };
      await expect(
        controller.updateListingScore(listingId, dto, adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Audit Logging on Moderation Actions (Task 2.3)', () => {
    it('should log audit record when approving directory listing', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateListingStatus.mockResolvedValue({
        id: listingId,
        status: 'approved',
      });

      const res = await controller.approveDirectoryListing(
        listingId,
        adminUser,
      );
      expect(res).toBeDefined();
      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: listingId,
        action: 'approve',
        admin_id: adminUser.id,
      });
    });

    it('should log audit record with reason when rejecting directory listing', async () => {
      userRolesRepo.getRole.mockResolvedValue('admin');
      mockDirectoryRepository.updateListingStatus.mockResolvedValue({
        id: listingId,
        status: 'rejected',
      });

      const res = await controller.rejectDirectoryListing(
        listingId,
        'Invalid business docs',
        adminUser,
      );
      expect(res).toBeDefined();
      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        entity_type: 'listing',
        entity_id: listingId,
        action: 'reject',
        admin_id: adminUser.id,
        reason: 'Invalid business docs',
      });
    });

    it('should log audit record when approving listing claim', async () => {
      const res = await controller.approveListingClaim('claim-1', adminUser);
      expect(res).toEqual({ success: true });
      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        entity_type: 'claim',
        entity_id: 'claim-1',
        action: 'approve',
        admin_id: adminUser.id,
      });
    });

    it('should log audit record when rejecting listing claim', async () => {
      const res = await controller.rejectListingClaim(
        'claim-1',
        'Not the owner',
        adminUser,
      );
      expect(res).toEqual({ success: true });
      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        entity_type: 'claim',
        entity_id: 'claim-1',
        action: 'reject',
        admin_id: adminUser.id,
        reason: 'Not the owner',
      });
    });
  });
});
