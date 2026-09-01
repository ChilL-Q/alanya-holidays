import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ForumDiscussionService } from './forum-discussion.service';
import { ForumRepository } from '../forum.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';

describe('ForumDiscussionService', () => {
  let service: ForumDiscussionService;
  let mockRepository: Record<string, jest.Mock>;
  let mockUserRoles: Record<string, jest.Mock>;

  const userId = '11111111-1111-4111-a111-111111111111';
  const otherUserId = '22222222-2222-4222-a222-222222222222';
  const postId = '33333333-3333-4333-a333-333333333333';
  const commentId = '44444444-4444-4444-a444-444444444444';

  beforeEach(async () => {
    mockRepository = {
      checkRateLimit: jest.fn().mockResolvedValue(true),
      getCategories: jest.fn().mockResolvedValue([]),
      getCategoryBySlug: jest.fn(),
      getCategoryById: jest.fn(),
      getCategoriesByIds: jest.fn().mockResolvedValue([]),
      getChildCategories: jest.fn().mockResolvedValue([]),
      insertCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      postCountsByCategory: jest.fn().mockResolvedValue(new Map()),
      getPosts: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getHotPosts: jest.fn().mockResolvedValue([]),
      getPostBySlug: jest.fn(),
      getPostSlugs: jest.fn().mockResolvedValue([]),
      insertPost: jest.fn(),
      getPostById: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      incrementPostView: jest.fn(),
      updatePostPinned: jest.fn(),
      setRemoved: jest.fn(),
      getComments: jest.fn().mockResolvedValue([]),
      insertComment: jest.fn(),
      getCommentById: jest.fn(),
      updateComment: jest
        .fn()
        .mockImplementation((id, updates) =>
          Promise.resolve({ id, ...updates }),
        ),
      deleteComment: jest.fn(),
      checkBookmark: jest.fn(),
      insertBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getUserBookmarks: jest.fn().mockResolvedValue([]),
      getRemovedComments: jest.fn().mockResolvedValue([]),
      toggleRow: jest.fn().mockResolvedValue({ active: true }),
      annotateLikes: jest
        .fn()
        .mockImplementation((rows) => Promise.resolve(rows)),
      attachCategoryParents: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({
        totalTopics: 10,
        totalReplies: 25,
        usersOnline: 3,
        latestMember: 'Alice',
      }),
    };

    mockUserRoles = {
      getRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumDiscussionService,
        {
          provide: ForumRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRoles,
        },
      ],
    }).compile();

    service = module.get<ForumDiscussionService>(ForumDiscussionService);
  });

  describe('Categories', () => {
    it('returns categories from repository', async () => {
      mockRepository.getCategories.mockResolvedValueOnce([
        { id: 'c-1', name: 'General' },
      ]);
      const res = await service.getForumCategories();
      expect(res).toEqual([{ id: 'c-1', name: 'General' }]);
    });

    it('builds category hierarchy tree', async () => {
      mockRepository.getCategories.mockResolvedValueOnce([
        { id: 'c-1', name: 'Root', parent_id: null },
        { id: 'c-2', name: 'Child', parent_id: 'c-1' },
      ]);
      mockRepository.postCountsByCategory.mockResolvedValueOnce(
        new Map([
          ['c-1', 5],
          ['c-2', 10],
        ]),
      );

      const tree = await service.getForumCategoryTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('c-1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].discussion_count).toBe(15);
    });

    it('requires admin to create/update/delete category', async () => {
      mockUserRoles.getRole.mockResolvedValue('user');
      await expect(
        service.createForumCategory({ name: 'News' }, userId),
      ).rejects.toThrow(UnauthorizedException);

      mockUserRoles.getRole.mockResolvedValue('admin');
      mockRepository.insertCategory.mockResolvedValueOnce({
        id: 'c-new',
        name: 'News',
      });
      const res = await service.createForumCategory({ name: 'News' }, userId);
      expect(res.id).toBe('c-new');
    });
  });

  describe('Posts', () => {
    it('rejects conflicting removed filters', async () => {
      await expect(
        service.getForumPosts({ includeRemoved: true, removedOnly: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('fetches posts and annotates them', async () => {
      const posts = [{ id: postId, title: 'Hello' }];
      mockRepository.getPosts.mockResolvedValueOnce({ data: posts, total: 1 });
      const res = await service.getForumPosts({ limit: 10, offset: 0 }, userId);
      expect(res.data).toEqual(posts);
      expect(res.total).toBe(1);
      expect(mockRepository.annotateLikes).toHaveBeenCalled();
      expect(mockRepository.attachCategoryParents).toHaveBeenCalled();
    });

    it('creates post with resolved slug', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([]);
      mockRepository.insertPost.mockResolvedValueOnce({
        id: postId,
        slug: 'test-post',
      });

      const res = await service.createForumPost(
        { title: 'Test Post', content: 'Body' },
        'discussion',
        userId,
      );
      expect(res.id).toBe(postId);
      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Post',
          slug: 'test-post',
          author_id: userId,
        }),
      );
    });

    it('persists an optional cover image URL when creating a post', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([]);
      mockRepository.insertPost.mockResolvedValueOnce({
        id: postId,
        slug: 'post-with-cover',
      });
      const input = {
        title: 'Post with cover',
        content: 'Body',
        image_url: 'https://cdn.example.com/forum/cover.webp',
      };

      await service.createForumPost(input, 'discussion', userId);

      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          image_url: 'https://cdn.example.com/forum/cover.webp',
        }),
      );
    });

    it('resolves category slug to UUID when category_id is provided as non-UUID slug', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([]);
      mockRepository.getCategoryBySlug.mockResolvedValueOnce({
        id: '11111111-2222-3333-4444-555555555555',
        name: 'General Discussion',
        slug: 'general',
      });
      mockRepository.insertPost.mockResolvedValueOnce({
        id: postId,
        slug: 'slug-test',
        category_id: '11111111-2222-3333-4444-555555555555',
      });

      await service.createForumPost(
        { title: 'Slug Test', content: 'Body', category_id: 'general' },
        'discussion',
        userId,
      );
      expect(mockRepository.getCategoryBySlug).toHaveBeenCalledWith('general');
      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          category_id: '11111111-2222-3333-4444-555555555555',
        }),
      );
    });

    it('hides removed post details from public users', async () => {
      mockRepository.getPostBySlug.mockResolvedValueOnce({
        id: postId,
        slug: 'hidden-post',
        title: 'Hidden',
        author_id: otherUserId,
        is_removed: true,
      });

      const res = await service.getForumPost('hidden-post');
      expect(res).toBeNull();
    });

    it('allows admin to view removed post details for moderation', async () => {
      mockRepository.getPostBySlug.mockResolvedValueOnce({
        id: postId,
        slug: 'hidden-post',
        title: 'Hidden',
        author_id: otherUserId,
        is_removed: true,
      });
      mockUserRoles.getRole.mockResolvedValueOnce('admin');

      const res = await service.getForumPost('hidden-post', userId);
      expect(res?.id).toBe(postId);
      expect(mockRepository.attachCategoryParents).toHaveBeenCalled();
    });

    it('updates post when user is author or admin', async () => {
      mockRepository.getPostById.mockResolvedValueOnce({
        id: postId,
        author_id: userId,
      });
      mockUserRoles.getRole.mockResolvedValueOnce('user');
      mockRepository.updatePost.mockResolvedValueOnce({
        id: postId,
        title: 'Updated',
      });

      const res = await service.updateForumPost(
        postId,
        { title: 'Updated' },
        userId,
      );
      expect(res.title).toBe('Updated');
    });

    it('rejects update post when user is neither author nor admin', async () => {
      mockRepository.getPostById.mockResolvedValueOnce({
        id: postId,
        author_id: otherUserId,
      });
      mockUserRoles.getRole.mockResolvedValueOnce('user');

      await expect(
        service.updateForumPost(postId, { title: 'Updated' }, userId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Comments & Likes', () => {
    it('passes exact comment pagination to the repository', async () => {
      mockRepository.getComments.mockResolvedValueOnce([{ id: commentId }]);

      await service.getForumComments(
        postId,
        { includeRemoved: false, limit: 11, offset: 22 },
        userId,
      );

      expect(mockRepository.getComments).toHaveBeenCalledWith(
        postId,
        false,
        11,
        22,
      );
    });

    it('creates comment', async () => {
      mockRepository.insertComment.mockResolvedValueOnce({
        id: commentId,
        body: 'Nice',
      });
      const res = await service.createForumComment(postId, 'Nice', userId);
      expect(res.id).toBe(commentId);
    });

    it('deletes comment when authorized', async () => {
      mockRepository.getCommentById.mockResolvedValueOnce({
        id: commentId,
        author_id: userId,
      });
      mockUserRoles.getRole.mockResolvedValueOnce('user');
      const res = await service.deleteForumComment(commentId, userId);
      expect(res).toEqual({ success: true });
    });

    it('toggles post like delegating to repository toggleRow', async () => {
      mockRepository.toggleRow.mockResolvedValueOnce({ active: true });
      const res = await service.togglePostLike(postId, userId);
      expect(res).toEqual({ liked: true });
      expect(mockRepository.toggleRow).toHaveBeenCalledWith(
        'forum_post_likes',
        'post_id',
        postId,
        userId,
      );
    });
  });

  describe('Rate Limiting (Task 4.5)', () => {
    it('throws 429 when post creation rate limit (5/hour) is exceeded', async () => {
      mockRepository.checkRateLimit.mockResolvedValueOnce(false);

      await expect(
        service.createForumPost(
          { title: 'Spam post', body: 'Content' },
          'discussion',
          userId,
        ),
      ).rejects.toThrow(
        new HttpException(
          'Превышен лимит создания постов (максимум 5 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
      expect(mockRepository.checkRateLimit).toHaveBeenCalledWith(
        userId,
        'post',
        5,
      );
    });

    it('throws 429 when comment creation rate limit (20/hour) is exceeded', async () => {
      mockRepository.checkRateLimit.mockResolvedValueOnce(false);

      await expect(
        service.createForumComment(postId, 'Spam comment', userId),
      ).rejects.toThrow(
        new HttpException(
          'Превышен лимит отправки комментариев (максимум 20 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
      expect(mockRepository.checkRateLimit).toHaveBeenCalledWith(
        userId,
        'comment',
        20,
      );
    });

    it('throws 429 when post like rate limit (60/hour) is exceeded', async () => {
      mockRepository.checkRateLimit.mockResolvedValueOnce(false);

      await expect(service.togglePostLike(postId, userId)).rejects.toThrow(
        new HttpException(
          'Превышен лимит лайков (максимум 60 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
      expect(mockRepository.checkRateLimit).toHaveBeenCalledWith(
        userId,
        'like',
        60,
      );
    });

    it('throws 429 when comment like rate limit (60/hour) is exceeded', async () => {
      mockRepository.checkRateLimit.mockResolvedValueOnce(false);

      await expect(
        service.toggleCommentLike(commentId, userId),
      ).rejects.toThrow(
        new HttpException(
          'Превышен лимит лайков (максимум 60 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
      expect(mockRepository.checkRateLimit).toHaveBeenCalledWith(
        userId,
        'like',
        60,
      );
    });
  });
});
