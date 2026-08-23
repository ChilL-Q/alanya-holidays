import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumRepository } from './forum.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('Forum Invariants Safety Net (PR-1 Invariant Spec)', () => {
  let service: ForumService;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockRepository: Record<string, jest.Mock>;

  const userAlice = '11111111-1111-4111-a111-111111111111';
  const userBob = '22222222-2222-4222-a222-222222222222';
  const adminUser = '33333333-3333-4333-a333-333333333333';
  const postId = '44444444-4444-4444-a444-444444444444';
  const commentId = '55555555-5555-4555-a555-555555555555';
  const eventId = '66666666-6666-4666-a666-666666666666';

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      getProfilesByIds: jest.fn().mockResolvedValue([]),
      getCategories: jest.fn().mockResolvedValue([]),
      getCategoryBySlug: jest.fn(),
      getCategoryById: jest.fn(),
      getCategoriesByIds: jest.fn().mockResolvedValue([]),
      getChildCategories: jest.fn().mockResolvedValue([]),
      insertCategory: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: 'cat-1', ...data }),
        ),
      updateCategory: jest
        .fn()
        .mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      deleteCategory: jest.fn().mockResolvedValue(undefined),
      getPostCategoryCounts: jest.fn().mockResolvedValue([]),
      getPosts: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getHotPosts: jest.fn().mockResolvedValue([]),
      getPostBySlug: jest.fn(),
      getPostSlugs: jest.fn().mockResolvedValue([]),
      insertPost: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: postId, ...data })),
      getPostById: jest.fn(),
      updatePost: jest
        .fn()
        .mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      deletePost: jest.fn().mockResolvedValue(undefined),
      incrementPostView: jest.fn().mockResolvedValue(undefined),
      updatePostPinned: jest.fn().mockResolvedValue(undefined),
      setRemoved: jest.fn().mockResolvedValue(undefined),
      getComments: jest.fn().mockResolvedValue([]),
      insertComment: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: 'com-1', ...data }),
        ),
      getCommentById: jest.fn(),
      deleteComment: jest.fn().mockResolvedValue(undefined),
      getRemovedComments: jest.fn().mockResolvedValue([]),
      checkPostLike: jest.fn(),
      insertPostLike: jest.fn().mockResolvedValue(undefined),
      deletePostLike: jest.fn().mockResolvedValue(undefined),
      checkCommentLike: jest.fn(),
      insertCommentLike: jest.fn().mockResolvedValue(undefined),
      deleteCommentLike: jest.fn().mockResolvedValue(undefined),
      getPostLikes: jest.fn().mockResolvedValue([]),
      getCommentLikes: jest.fn().mockResolvedValue([]),
      getEvents: jest.fn().mockResolvedValue([]),
      getEventBySlug: jest.fn(),
      getEventSlugs: jest.fn().mockResolvedValue([]),
      insertEvent: jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({ id: 'evt-1', ...data }),
        ),
      updateEvent: jest
        .fn()
        .mockImplementation((id, data) => Promise.resolve({ id, ...data })),
      deleteEvent: jest.fn().mockResolvedValue(undefined),
      getEventRsvpAttendees: jest.fn().mockResolvedValue([]),
      checkEventRsvp: jest.fn(),
      insertEventRsvp: jest.fn().mockResolvedValue(undefined),
      deleteEventRsvp: jest.fn().mockResolvedValue(undefined),
      getEventRsvps: jest.fn().mockResolvedValue([]),
      insertReport: jest.fn().mockResolvedValue(undefined),
      getReports: jest.fn().mockResolvedValue([]),
      updateReportResolved: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({
        totalTopics: 0,
        totalReplies: 0,
        usersOnline: 0,
        latestMember: null,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumService,
        {
          provide: ForumRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
      ],
    }).compile();

    service = module.get<ForumService>(ForumService);
  });

  describe('1. Permission Model Invariants', () => {
    describe('1.1 Admin-Only Operations', () => {
      it('Category mutations require admin role', async () => {
        mockUserRolesRepo.getRole.mockResolvedValue('user');

        await expect(
          service.createForumCategory({ name: 'General' }, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.updateForumCategory('cat-1', { name: 'New' }, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.deleteForumCategory('cat-1', userAlice),
        ).rejects.toThrow(UnauthorizedException);

        // Admin succeeds
        mockUserRolesRepo.getRole.mockResolvedValue('admin');
        await expect(
          service.createForumCategory({ name: 'General' }, adminUser),
        ).resolves.toBeDefined();
        await expect(
          service.updateForumCategory('cat-1', { name: 'New' }, adminUser),
        ).resolves.toBeDefined();
        await expect(
          service.deleteForumCategory('cat-1', adminUser),
        ).resolves.toEqual({ success: true });
      });

      it('Event mutations and attendee queries require admin role', async () => {
        mockUserRolesRepo.getRole.mockResolvedValue('user');

        await expect(
          service.createForumEvent(
            { title: 'Party', event_date: '2026-09-01' },
            userAlice,
          ),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.updateForumEvent(eventId, { title: 'New Party' }, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.deleteForumEvent(eventId, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.getEventAttendees(eventId, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.getForumEvents({ includeUnpublished: true }, userAlice),
        ).rejects.toThrow(UnauthorizedException);

        // Admin succeeds
        mockUserRolesRepo.getRole.mockResolvedValue('admin');
        await expect(
          service.createForumEvent(
            { title: 'Party', event_date: '2026-09-01' },
            adminUser,
          ),
        ).resolves.toBeDefined();
        await expect(
          service.updateForumEvent(eventId, { title: 'New Party' }, adminUser),
        ).resolves.toBeDefined();
        await expect(
          service.deleteForumEvent(eventId, adminUser),
        ).resolves.toEqual({ success: true });
      });

      it('Moderation actions (pin, setRemoved, reports triage) require admin role', async () => {
        mockUserRolesRepo.getRole.mockResolvedValue('user');

        await expect(
          service.setPinned(postId, true, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.setRemoved('post', postId, true, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.setRemoved('comment', commentId, true, userAlice),
        ).rejects.toThrow(UnauthorizedException);
        await expect(service.getRemovedComments(10, userAlice)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.getForumReports(false, userAlice)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(
          service.resolveForumReport('rep-1', userAlice),
        ).rejects.toThrow(UnauthorizedException);

        // Admin succeeds
        mockUserRolesRepo.getRole.mockResolvedValue('admin');
        await expect(
          service.setPinned(postId, true, adminUser),
        ).resolves.toEqual({ success: true });
        await expect(
          service.setRemoved('post', postId, true, adminUser),
        ).resolves.toEqual({ success: true });
        await expect(
          service.resolveForumReport('rep-1', adminUser),
        ).resolves.toEqual({ success: true });
      });
    });

    describe('1.2 Author-or-Admin Resource Permissions', () => {
      it('updateForumPost: allows author OR admin, rejects unauthorized 3rd party', async () => {
        mockRepository.getPostById.mockResolvedValue({
          id: postId,
          author_id: userAlice,
        });

        // 1. Author (Alice) updates -> Success
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(
          service.updateForumPost(postId, { title: 'Alice Edit' }, userAlice),
        ).resolves.toBeDefined();

        // 2. Admin updates Alice's post -> Success
        mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
        await expect(
          service.updateForumPost(postId, { title: 'Admin Edit' }, adminUser),
        ).resolves.toBeDefined();

        // 3. Bob (non-author, non-admin) updates Alice's post -> Throws UnauthorizedException
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(
          service.updateForumPost(
            postId,
            { title: 'Bob Malicious Edit' },
            userBob,
          ),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('deleteForumPost: allows author OR admin, rejects unauthorized 3rd party', async () => {
        mockRepository.getPostById.mockResolvedValue({
          id: postId,
          author_id: userAlice,
        });

        // Author deletes
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(
          service.deleteForumPost(postId, userAlice),
        ).resolves.toEqual({ success: true });

        // Admin deletes
        mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
        await expect(
          service.deleteForumPost(postId, adminUser),
        ).resolves.toEqual({ success: true });

        // Bob deletes -> UnauthorizedException
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(service.deleteForumPost(postId, userBob)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('deleteForumComment: allows author OR admin, rejects unauthorized 3rd party', async () => {
        mockRepository.getCommentById.mockResolvedValue({
          id: commentId,
          author_id: userAlice,
        });

        // Author deletes
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(
          service.deleteForumComment(commentId, userAlice),
        ).resolves.toEqual({ success: true });

        // Admin deletes
        mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
        await expect(
          service.deleteForumComment(commentId, adminUser),
        ).resolves.toEqual({ success: true });

        // Bob deletes -> UnauthorizedException
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(
          service.deleteForumComment(commentId, userBob),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('Throws NotFoundException when updating/deleting non-existent post or comment', async () => {
        mockRepository.getPostById.mockResolvedValueOnce(null);
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(
          service.updateForumPost('non-existent', { title: 'Test' }, userAlice),
        ).rejects.toThrow(NotFoundException);

        mockRepository.getCommentById.mockResolvedValueOnce(null);
        mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
        await expect(
          service.deleteForumComment('non-existent', userAlice),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('2. Race-Safe Toggle Concurrency Invariants (PG 23505 Tolerance)', () => {
    it('2.1 togglePostLike: returns { liked: true } without throwing when duplicate key 23505 occurs', async () => {
      // User is not liked according to check
      mockRepository.checkPostLike.mockResolvedValueOnce(null);
      // Concurrent request won the race and inserted the row first -> PG 23505 unique error thrown
      mockRepository.insertPostLike.mockRejectedValueOnce(
        new Error(
          'duplicate key value violates unique constraint "forum_post_likes_pkey" - error 23505',
        ),
      );

      const res = await service.togglePostLike(postId, userAlice);

      // Must tolerate race condition gracefully
      expect(res).toEqual({ liked: true });
    });

    it('2.2 togglePostLike: toggles off and returns { liked: false } when already liked', async () => {
      mockRepository.checkPostLike.mockResolvedValueOnce({ id: 'like-1' });

      const res = await service.togglePostLike(postId, userAlice);

      expect(mockRepository.deletePostLike).toHaveBeenCalledWith(
        postId,
        userAlice,
      );
      expect(res).toEqual({ liked: false });
    });

    it('2.3 togglePostLike: rethrows unexpected database errors', async () => {
      mockRepository.checkPostLike.mockResolvedValueOnce(null);
      mockRepository.insertPostLike.mockRejectedValueOnce(
        new Error('Connection terminated unexpectedly'),
      );

      await expect(service.togglePostLike(postId, userAlice)).rejects.toThrow(
        'Connection terminated unexpectedly',
      );
    });

    it('2.4 toggleCommentLike: returns { liked: true } on PG 23505 unique constraint error', async () => {
      mockRepository.checkCommentLike.mockResolvedValueOnce(null);
      mockRepository.insertCommentLike.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint (23505)'),
      );

      const res = await service.toggleCommentLike(commentId, userAlice);
      expect(res).toEqual({ liked: true });
    });

    it('2.5 toggleEventRsvp: returns { going: true } on PG 23505 unique constraint error', async () => {
      mockRepository.checkEventRsvp.mockResolvedValueOnce(null);
      mockRepository.insertEventRsvp.mockRejectedValueOnce(
        new Error(
          'Key (event_id, user_id) already exists. unique_violation 23505',
        ),
      );

      const res = await service.toggleEventRsvp(
        eventId,
        '+905551234567',
        userAlice,
      );
      expect(res).toEqual({ going: true });
    });
  });

  describe('3. Slug Collision Resolution Invariants', () => {
    it('3.1 createForumPost: increments numeric suffix when slug collision exists in database', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([
        'living-in-alanya',
        'living-in-alanya-1',
      ]);

      const _res = await service.createForumPost(
        { title: 'Living in Alanya', body: 'Post content' },
        'discussion',
        userAlice,
      );

      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'living-in-alanya-2',
          title: 'Living in Alanya',
          author_id: userAlice,
        }),
      );
    });

    it('3.2 createForumPost: transliterates Turkish and Cyrillic characters properly', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([]);

      await service.createForumPost(
        { title: 'En İyi Plajlar & Oteller', body: 'Turkish chars' },
        'discussion',
        userAlice,
      );
      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'en-iyi-plajlar-oteller',
        }),
      );

      mockRepository.getPostSlugs.mockResolvedValueOnce([]);
      await service.createForumPost(
        { title: 'Лучшие рестораны Аланьи', body: 'Cyrillic chars' },
        'discussion',
        userAlice,
      );
      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'luchshie-restorany-alani',
        }),
      );
    });

    it('3.3 createForumPost: falls back to default seed when title contains only special characters', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([]);

      await service.createForumPost(
        { title: '??? !!!', body: 'No alphanumeric chars' },
        'discussion',
        userAlice,
      );
      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'post',
        }),
      );
    });

    it('3.4 createForumEvent: resolves event slug collisions with progressive numbering', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getEventSlugs.mockResolvedValueOnce([
        'beach-volleyball-tournament',
      ]);

      await service.createForumEvent(
        { title: 'Beach Volleyball Tournament', event_date: '2026-08-30' },
        adminUser,
      );

      expect(mockRepository.insertEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'beach-volleyball-tournament-1',
          created_by: adminUser,
        }),
      );
    });
  });

  describe('4. Soft Removal and Filter Invariants', () => {
    it('4.1 getForumPosts: throws BadRequestException if both removedOnly and includeRemoved are specified', async () => {
      await expect(
        service.getForumPosts({
          removedOnly: true,
          includeRemoved: true,
        } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getForumPosts({
          removedOnly: true,
          includeRemoved: true,
        } as any),
      ).rejects.toThrow('Cannot specify both removedOnly and includeRemoved');
    });

    it('4.2 getForumPosts: correctly passes removedOnly or includeRemoved flags to repository filter', async () => {
      await service.getForumPosts({ removedOnly: true });
      expect(mockRepository.getPosts).toHaveBeenCalledWith(
        expect.objectContaining({ removedOnly: true }),
        20,
        0,
      );

      await service.getForumPosts({ includeRemoved: true });
      expect(mockRepository.getPosts).toHaveBeenCalledWith(
        expect.objectContaining({ includeRemoved: true }),
        20,
        0,
      );
    });
  });
});
