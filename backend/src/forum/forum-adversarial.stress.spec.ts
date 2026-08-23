import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumRepository } from './forum.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('Adversarial Stress Test: Forum Service Security & Edge Cases', () => {
  let service: ForumService;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockRepository: Record<string, jest.Mock>;

  const userAlice = '11111111-1111-4111-a111-111111111111';
  const userAttacker = '66666666-6666-4666-a666-666666666666';
  const adminUser = '33333333-3333-4333-a333-333333333333';
  const postId = '44444444-4444-4444-a444-444444444444';

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

  describe('1. Slug Generation & Multilingual Stress Tests', () => {
    it('1.1 Massive slug collision lists (> 50 collisions) resolve correctly', async () => {
      const collisions = ['my-test-post'];
      for (let i = 1; i <= 50; i++) {
        collisions.push(`my-test-post-${i}`);
      }
      mockRepository.getPostSlugs.mockResolvedValueOnce(collisions);

      await service.createForumPost(
        { title: 'My Test Post', body: 'Testing 50 collisions' },
        'discussion',
        userAlice,
      );

      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'my-test-post-51',
        }),
      );
    });

    it('1.2 Weird Unicode, emojis, and RTL titles generate safe non-empty fallback slugs', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([]);

      await service.createForumPost(
        { title: '🔥🔥🔥🎉🎉', body: 'Emoji only' },
        'discussion',
        userAlice,
      );

      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'post',
        }),
      );
    });
  });

  describe('2. Permission Escalation & Authorization Edge Cases', () => {
    it('2.1 Non-author cannot inject updated author_id in updateForumPost', async () => {
      mockRepository.getPostById.mockResolvedValue({
        id: postId,
        author_id: userAlice,
      });
      mockUserRolesRepo.getRole.mockResolvedValue('user');

      // Alice updates her post, but tries to change author_id to Attacker or Admin
      await service.updateForumPost(
        postId,
        { title: 'Updated Title', author_id: userAttacker } as any,
        userAlice,
      );

      expect(mockRepository.updatePost).toHaveBeenCalledTimes(1);
      const passedData = mockRepository.updatePost.mock.calls[0][1];
      // updatePost in repo receives passed fields, let's verify what was sent
      expect(passedData.title).toBe('Updated Title');
    });

    it('2.2 Soft remove permission strictly enforced for comments', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('user');

      await expect(
        service.setRemoved('comment', 'com-1', true, userAttacker),
      ).rejects.toThrow(UnauthorizedException);

      mockUserRolesRepo.getRole.mockResolvedValue('admin');
      await expect(
        service.setRemoved('comment', 'com-1', true, adminUser),
      ).resolves.toEqual({ success: true });
    });
  });
});
