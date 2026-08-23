import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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
      deleteComment: jest.fn(),
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
});
