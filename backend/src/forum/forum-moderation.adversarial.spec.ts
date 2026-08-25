import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ForumDiscussionService } from './application/forum-discussion.service';
import { ForumReportService } from './application/forum-report.service';
import { ForumRepository } from './forum.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { ForumModerationController } from './forum-moderation.controller';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateForumReportDto,
  GetForumReportsQueryDto,
} from './dto/forum-reports.dto';
import { AuthUser } from '../auth/types/auth-user.interface';
import { SupabaseService } from '../supabase/supabase.service';

describe('Empirical Adversarial Challenge: Forum Moderation Suite', () => {
  let discussionService: ForumDiscussionService;
  let reportService: ForumReportService;
  let moderationController: ForumModerationController;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRolesRepo: { getRole: jest.Mock };

  const adminUserId = 'admin-uuid-0000-0000-000000000001';
  const normalUserId = 'user-uuid-0000-0000-000000000002';
  const attackerUserId = 'hacker-uuid-0000-0000-000000000003';
  const authorUserId = 'author-uuid-0000-0000-000000000004';

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn().mockImplementation((userId: string) => {
        if (userId === adminUserId) return Promise.resolve('admin');
        return Promise.resolve('user');
      }),
    };

    mockRepository = {
      getReports: jest.fn().mockResolvedValue([]),
      insertReport: jest.fn().mockResolvedValue(undefined),
      updateReportResolved: jest.fn().mockResolvedValue(undefined),
      getRemovedComments: jest.fn().mockResolvedValue([]),
      setRemoved: jest.fn().mockResolvedValue(undefined),
      updatePostPinned: jest.fn().mockResolvedValue(undefined),
      getPostById: jest.fn(),
      deletePost: jest.fn().mockResolvedValue(undefined),
      getCommentById: jest.fn(),
      deleteComment: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({
        totalTopics: 10,
        totalReplies: 50,
        usersOnline: 3,
        latestMember: 'Alice',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForumModerationController],
      providers: [
        ForumDiscussionService,
        ForumReportService,
        {
          provide: ForumRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    discussionService = module.get<ForumDiscussionService>(
      ForumDiscussionService,
    );
    reportService = module.get<ForumReportService>(ForumReportService);
    moderationController = module.get<ForumModerationController>(
      ForumModerationController,
    );
  });

  describe('1. Boundary Condition & DTO Validation Stress Tests', () => {
    it('1.1 should reject GetForumReportsQueryDto with limit=0', async () => {
      const dto = plainToInstance(GetForumReportsQueryDto, {
        limit: '0',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const limitErr = errors.find((e) => e.property === 'limit');
      expect(limitErr).toBeDefined();
      expect(limitErr?.constraints?.min).toBeDefined();
    });

    it('1.2 should accept GetForumReportsQueryDto with limit=1 and limit=100', async () => {
      const dtoMin = plainToInstance(GetForumReportsQueryDto, {
        limit: '1',
      });
      const errorsMin = await validate(dtoMin);
      expect(errorsMin.length).toBe(0);
      expect(dtoMin.limit).toBe(1);

      const dtoMax = plainToInstance(GetForumReportsQueryDto, {
        limit: '100',
      });
      const errorsMax = await validate(dtoMax);
      expect(errorsMax.length).toBe(0);
      expect(dtoMax.limit).toBe(100);
    });

    it('1.3 should reject GetForumReportsQueryDto with limit=101 or negative limit', async () => {
      const dtoOver = plainToInstance(GetForumReportsQueryDto, {
        limit: '101',
      });
      const errorsOver = await validate(dtoOver);
      expect(errorsOver.length).toBeGreaterThan(0);
      const limitErr = errorsOver.find((e) => e.property === 'limit');
      expect(limitErr?.constraints?.max).toBeDefined();

      const dtoNeg = plainToInstance(GetForumReportsQueryDto, {
        limit: '-5',
      });
      const errorsNeg = await validate(dtoNeg);
      expect(errorsNeg.length).toBeGreaterThan(0);
    });

    it('1.4 should reject GetForumReportsQueryDto with page=0 or negative page', async () => {
      const dtoZero = plainToInstance(GetForumReportsQueryDto, {
        page: '0',
      });
      const errorsZero = await validate(dtoZero);
      expect(errorsZero.length).toBeGreaterThan(0);
      const pageErr = errorsZero.find((e) => e.property === 'page');
      expect(pageErr?.constraints?.min).toBeDefined();

      const dtoValid = plainToInstance(GetForumReportsQueryDto, {
        page: '1',
      });
      const errorsValid = await validate(dtoValid);
      expect(errorsValid.length).toBe(0);
      expect(dtoValid.page).toBe(1);
    });

    it('1.5 should reject invalid target_type and accept only post or comment', async () => {
      const dtoInvalid = plainToInstance(GetForumReportsQueryDto, {
        target_type: 'invalid_type',
      });
      const errorsInvalid = await validate(dtoInvalid);
      expect(errorsInvalid.length).toBeGreaterThan(0);
      const typeErr = errorsInvalid.find((e) => e.property === 'target_type');
      expect(typeErr?.constraints?.isIn).toBeDefined();

      const dtoPost = plainToInstance(GetForumReportsQueryDto, {
        target_type: 'post',
      });
      expect(await validate(dtoPost)).toHaveLength(0);

      const dtoComment = plainToInstance(GetForumReportsQueryDto, {
        target_type: 'comment',
      });
      expect(await validate(dtoComment)).toHaveLength(0);
    });

    it('1.6 should validate CreateForumReportDto requirements', async () => {
      const emptyDto = plainToInstance(CreateForumReportDto, {});
      const errorsEmpty = await validate(emptyDto);
      expect(errorsEmpty.length).toBeGreaterThanOrEqual(3);

      const invalidTarget = plainToInstance(CreateForumReportDto, {
        target_type: 'user',
        target_id: 'u-1',
        reason: 'spam',
      });
      const errorsInvalidTarget = await validate(invalidTarget);
      expect(errorsInvalidTarget.length).toBeGreaterThan(0);

      const validDto = plainToInstance(CreateForumReportDto, {
        target_type: 'post',
        target_id: 'post-123',
        reason: 'Inappropriate language',
      });
      const errorsValid = await validate(validDto);
      expect(errorsValid.length).toBe(0);
    });
  });

  describe('2. Authorization & Non-Admin Escalation Attack Tests', () => {
    it('2.1 non-admin cannot access getForumReports', async () => {
      await expect(
        reportService.getForumReports({ includeResolved: false }, normalUserId),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        reportService.getForumReports(
          { includeResolved: false },
          attackerUserId,
        ),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        reportService.getForumReports({ includeResolved: false }, adminUserId),
      ).resolves.toEqual([]);
    });

    it('2.2 non-admin cannot resolve forum reports', async () => {
      await expect(
        reportService.resolveForumReport('report-1', normalUserId),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        reportService.resolveForumReport('report-1', adminUserId),
      ).resolves.toEqual({ success: true });
    });

    it('2.3 non-admin cannot access getRemovedComments', async () => {
      await expect(
        discussionService.getRemovedComments(50, normalUserId),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        discussionService.getRemovedComments(50, adminUserId),
      ).resolves.toEqual([]);
    });

    it('2.4 non-admin cannot set post or comment pinned / removed status', async () => {
      await expect(
        discussionService.setPinned('post-1', true, normalUserId),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        discussionService.setRemoved('post', 'post-1', true, normalUserId),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        discussionService.setRemoved(
          'comment',
          'comment-1',
          true,
          normalUserId,
        ),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        discussionService.setPinned('post-1', true, adminUserId),
      ).resolves.toEqual({ success: true });

      await expect(
        discussionService.setRemoved('post', 'post-1', true, adminUserId),
      ).resolves.toEqual({ success: true });

      await expect(
        discussionService.setRemoved('comment', 'comment-1', true, adminUserId),
      ).resolves.toEqual({ success: true });
    });

    it('2.5 attacker cannot hard delete another user post or comment, but author and admin can', async () => {
      mockRepository.getPostById.mockResolvedValue({
        id: 'post-1',
        author_id: authorUserId,
      });
      mockRepository.getCommentById.mockResolvedValue({
        id: 'comment-1',
        author_id: authorUserId,
      });

      // Attacker attempt
      await expect(
        discussionService.deleteForumPost('post-1', attackerUserId),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        discussionService.deleteForumComment('comment-1', attackerUserId),
      ).rejects.toThrow(UnauthorizedException);

      // Author attempt
      await expect(
        discussionService.deleteForumPost('post-1', authorUserId),
      ).resolves.toEqual({ success: true });

      await expect(
        discussionService.deleteForumComment('comment-1', authorUserId),
      ).resolves.toEqual({ success: true });

      // Admin attempt
      await expect(
        discussionService.deleteForumPost('post-1', adminUserId),
      ).resolves.toEqual({ success: true });

      await expect(
        discussionService.deleteForumComment('comment-1', adminUserId),
      ).resolves.toEqual({ success: true });
    });

    it('2.6 non-existent post or comment deletion throws NotFoundException', async () => {
      mockRepository.getPostById.mockResolvedValue(null);
      mockRepository.getCommentById.mockResolvedValue(null);

      await expect(
        discussionService.deleteForumPost('non-existent-post', adminUserId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        discussionService.deleteForumComment(
          'non-existent-comment',
          adminUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Soft-Remove vs Restore vs Hard-Delete Idempotency Tests', () => {
    it('3.1 soft-removing already removed post/comment is idempotent', async () => {
      // Multiple soft-removes in succession
      await discussionService.setRemoved('post', 'post-100', true, adminUserId);
      await discussionService.setRemoved('post', 'post-100', true, adminUserId);
      await discussionService.setRemoved('post', 'post-100', true, adminUserId);

      expect(mockRepository.setRemoved).toHaveBeenCalledTimes(3);
      expect(mockRepository.setRemoved).toHaveBeenLastCalledWith(
        'forum_posts',
        'post-100',
        true,
      );
    });

    it('3.2 restoring already restored post/comment is idempotent', async () => {
      // Multiple restores in succession
      await discussionService.setRemoved(
        'post',
        'post-100',
        false,
        adminUserId,
      );
      await discussionService.setRemoved(
        'post',
        'post-100',
        false,
        adminUserId,
      );

      expect(mockRepository.setRemoved).toHaveBeenCalledWith(
        'forum_posts',
        'post-100',
        false,
      );

      await discussionService.setRemoved(
        'comment',
        'comment-100',
        false,
        adminUserId,
      );
      await discussionService.setRemoved(
        'comment',
        'comment-100',
        false,
        adminUserId,
      );

      expect(mockRepository.setRemoved).toHaveBeenCalledWith(
        'forum_comments',
        'comment-100',
        false,
      );
    });

    it('3.3 pin and unpin operations are idempotent', async () => {
      await discussionService.setPinned('post-200', true, adminUserId);
      await discussionService.setPinned('post-200', true, adminUserId);
      expect(mockRepository.updatePostPinned).toHaveBeenCalledWith(
        'post-200',
        true,
      );

      await discussionService.setPinned('post-200', false, adminUserId);
      await discussionService.setPinned('post-200', false, adminUserId);
      expect(mockRepository.updatePostPinned).toHaveBeenCalledWith(
        'post-200',
        false,
      );
    });

    it('3.4 resolve report operation is idempotent', async () => {
      await reportService.resolveForumReport('report-55', adminUserId);
      await reportService.resolveForumReport('report-55', adminUserId);

      expect(mockRepository.updateReportResolved).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateReportResolved).toHaveBeenCalledWith(
        'report-55',
      );
    });
  });

  describe('4. Controller Parameter Transformation & Delegation', () => {
    const adminAuthUser: AuthUser = { id: adminUserId };

    it('4.1 should pass sanitized pagination and filter parameters from query to service', async () => {
      await moderationController.getForumReports(
        {
          includeResolved: true,
          page: 3,
          limit: 25,
          target_type: 'comment',
        },
        adminAuthUser,
      );

      expect(mockRepository.getReports).toHaveBeenCalledWith({
        includeResolved: true,
        page: 3,
        limit: 25,
        target_type: 'comment',
      });
    });

    it('4.2 should handle missing optional query parameters gracefully', async () => {
      await moderationController.getForumReports({}, adminAuthUser);

      expect(mockRepository.getReports).toHaveBeenCalledWith({
        includeResolved: false,
        page: undefined,
        limit: undefined,
        target_type: undefined,
      });
    });
  });

  describe('5. Repository Range Pagination and Filtering Logic', () => {
    let repo: ForumRepository;
    let queryChain: Record<string, jest.Mock>;
    let mockSupabase: { getClient: jest.Mock };

    beforeEach(() => {
      queryChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) =>
          resolve({
            data: [{ id: 'rep-1', target_type: 'post', resolved: false }],
            error: null,
          }),
        ),
      };

      mockSupabase = {
        getClient: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue(queryChain),
        }),
      };

      repo = new ForumRepository(mockSupabase as unknown as SupabaseService);
    });

    it('5.1 should apply page and limit range calculations accurately', async () => {
      // Page 1, limit 20 -> 0 to 19
      await repo.getReports({ page: 1, limit: 20 });
      expect(queryChain.range).toHaveBeenCalledWith(0, 19);

      // Page 3, limit 10 -> (3 - 1) * 10 = 20 to 29
      await repo.getReports({ page: 3, limit: 10 });
      expect(queryChain.range).toHaveBeenCalledWith(20, 29);

      // Page 5, limit 100 -> (5 - 1) * 100 = 400 to 499
      await repo.getReports({ page: 5, limit: 100 });
      expect(queryChain.range).toHaveBeenCalledWith(400, 499);
    });

    it('5.2 should filter by target_type and resolved status correctly', async () => {
      await repo.getReports({ target_type: 'comment', includeResolved: false });
      expect(queryChain.eq).toHaveBeenCalledWith('resolved', false);
      expect(queryChain.eq).toHaveBeenCalledWith('target_type', 'comment');
    });

    it('5.3 should preserve backward compatibility with boolean options', async () => {
      // getReports(false) -> resolved = false
      await repo.getReports(false);
      expect(queryChain.eq).toHaveBeenCalledWith('resolved', false);

      // getReports(true) -> includeResolved = true, so no eq('resolved', false) filter applied in this call
      queryChain.eq.mockClear();
      await repo.getReports(true);
      expect(queryChain.eq).not.toHaveBeenCalledWith('resolved', false);
    });
  });
});
