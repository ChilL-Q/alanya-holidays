import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumRepository } from './forum.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('ForumService', () => {
  let service: ForumService;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockRepository: Record<string, jest.Mock>;

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
      insertCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      getPostCategoryCounts: jest.fn().mockResolvedValue([]),
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
      checkPostLike: jest.fn(),
      insertPostLike: jest.fn(),
      deletePostLike: jest.fn(),
      checkCommentLike: jest.fn(),
      insertCommentLike: jest.fn(),
      deleteCommentLike: jest.fn(),
      getPostLikes: jest.fn().mockResolvedValue([]),
      getCommentLikes: jest.fn().mockResolvedValue([]),
      getEvents: jest.fn().mockResolvedValue([]),
      getEventBySlug: jest.fn(),
      getEventSlugs: jest.fn().mockResolvedValue([]),
      insertEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      getEventRsvpAttendees: jest.fn().mockResolvedValue([]),
      checkEventRsvp: jest.fn(),
      insertEventRsvp: jest.fn(),
      deleteEventRsvp: jest.fn(),
      getEventRsvps: jest.fn().mockResolvedValue([]),
      insertReport: jest.fn(),
      getReports: jest.fn().mockResolvedValue([]),
      updateReportResolved: jest.fn(),
      getStats: jest.fn().mockResolvedValue({
        totalTopics: 10,
        totalReplies: 25,
        usersOnline: 3,
        latestMember: 'Alice',
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

  describe('Category operations', () => {
    it('should return flat list of categories via getForumCategories', async () => {
      mockRepository.getCategories.mockResolvedValueOnce([
        { id: 'cat-1', name: 'General' },
      ]);
      const res = await service.getForumCategories();
      expect(res).toEqual([{ id: 'cat-1', name: 'General' }]);
    });

    it('should build hierarchical category tree with post counts', async () => {
      mockRepository.getCategories.mockResolvedValueOnce([
        { id: 'cat-1', name: 'Living', slug: 'living', parent_id: null },
        { id: 'cat-2', name: 'Housing', slug: 'housing', parent_id: 'cat-1' },
      ]);
      mockRepository.getPostCategoryCounts.mockResolvedValueOnce([
        { category_id: 'cat-1' },
        { category_id: 'cat-2' },
        { category_id: 'cat-2' },
      ]);

      const tree = await service.getForumCategoryTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('cat-1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children?.[0].discussion_count).toBe(2);
      expect(tree[0].discussion_count).toBe(3);
    });

    it('should return empty tree when categories table is empty', async () => {
      mockRepository.getCategories.mockResolvedValueOnce([]);
      mockRepository.getPostCategoryCounts.mockResolvedValueOnce([]);

      const tree = await service.getForumCategoryTree();
      expect(tree).toEqual([]);
    });

    it('should return null if category slug does not exist', async () => {
      mockRepository.getCategoryBySlug.mockResolvedValueOnce(null);
      const res = await service.getForumCategory('missing-slug');
      expect(res).toBeNull();
    });

    it('should populate children and discussion count for root category in getForumCategory', async () => {
      mockRepository.getCategoryBySlug.mockResolvedValueOnce({
        id: 'root-1',
        name: 'Root',
        parent_id: null,
      });
      mockRepository.getPostCategoryCounts.mockResolvedValueOnce([
        { category_id: 'root-1' },
        { category_id: 'child-1' },
      ]);
      mockRepository.getChildCategories.mockResolvedValueOnce([
        { id: 'child-1', name: 'Child', parent_id: 'root-1' },
      ]);

      const cat = await service.getForumCategory('root');
      expect(cat).toBeDefined();
      expect(cat?.children).toHaveLength(1);
      expect(cat?.children?.[0].discussion_count).toBe(1);
      expect(cat?.discussion_count).toBe(2);
      expect(cat?.topic_count).toBe(1);
    });

    it('should populate parent and discussion count for subcategory in getForumCategory', async () => {
      mockRepository.getCategoryBySlug.mockResolvedValueOnce({
        id: 'child-1',
        name: 'Child',
        parent_id: 'root-1',
      });
      mockRepository.getPostCategoryCounts.mockResolvedValueOnce([
        { category_id: 'child-1' },
      ]);
      mockRepository.getCategoryById.mockResolvedValueOnce({
        id: 'root-1',
        name: 'Root',
      });

      const cat = await service.getForumCategory('child');
      expect(cat).toBeDefined();
      expect(cat?.parent).toEqual({ id: 'root-1', name: 'Root' });
      expect(cat?.discussion_count).toBe(1);
    });

    it('should enforce admin role for category creation', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.createForumCategory({ name: 'News' }, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create category when user is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.insertCategory.mockResolvedValueOnce({
        id: 'cat-new',
        name: 'General News',
        slug: 'general-news',
      });

      const result = await service.createForumCategory(
        { name: 'General News' },
        'admin-1',
      );

      expect(result.id).toBe('cat-new');
      expect(mockRepository.insertCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'General News',
          slug: 'general-news',
        }),
      );
    });

    it('should enforce admin role for category update and safe field mapping', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(
        service.updateForumCategory('cat-1', { name: 'New Name' }, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateCategory.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'New Name',
        slug: 'new-name',
      });

      const updated = await service.updateForumCategory(
        'cat-1',
        { name: 'New Name', description: 'Desc' },
        'admin-1',
      );
      expect(updated.id).toBe('cat-1');
      expect(mockRepository.updateCategory).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({
          name: 'New Name',
          slug: 'new-name',
          description: 'Desc',
        }),
      );
    });

    it('should enforce admin role for category deletion', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(
        service.deleteForumCategory('cat-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.deleteCategory.mockResolvedValueOnce(undefined);
      const res = await service.deleteForumCategory('cat-1', 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.deleteCategory).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('Post operations', () => {
    it('should throw BadRequestException if both removedOnly and includeRemoved are specified', async () => {
      await expect(
        service.getForumPosts({ removedOnly: true, includeRemoved: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return empty list if specified categorySlug is not found', async () => {
      mockRepository.getCategoryBySlug.mockResolvedValueOnce(null);

      const res = await service.getForumPosts({ categorySlug: 'non-existent' });
      expect(res).toEqual({ data: [], total: 0 });
    });

    it('should query posts with root category and child category IDs', async () => {
      mockRepository.getCategoryBySlug.mockResolvedValueOnce({
        id: 'root-1',
        parent_id: null,
      });
      mockRepository.getChildCategories.mockResolvedValueOnce([
        { id: 'child-1' },
        { id: 'child-2' },
      ]);
      mockRepository.getPosts.mockResolvedValueOnce({
        data: [{ id: 'p-1', title: 'Post 1' }],
        total: 1,
      });

      const res = await service.getForumPosts({ categorySlug: 'root' });
      expect(res.total).toBe(1);
      expect(mockRepository.getPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryIds: ['root-1', 'child-1', 'child-2'],
        }),
        20,
        0,
      );
    });

    it('should query posts with subcategory ID only if category is a child', async () => {
      mockRepository.getCategoryBySlug.mockResolvedValueOnce({
        id: 'child-1',
        parent_id: 'root-1',
      });
      mockRepository.getPosts.mockResolvedValueOnce({
        data: [{ id: 'p-2', title: 'Post 2' }],
        total: 1,
      });

      const res = await service.getForumPosts({ categorySlug: 'child-1' });
      expect(res.total).toBe(1);
      expect(mockRepository.getPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryIds: ['child-1'],
        }),
        20,
        0,
      );
    });

    it('should attach missing category parents to returned posts', async () => {
      mockRepository.getPosts.mockResolvedValueOnce({
        data: [
          {
            id: 'p-1',
            category: { id: 'c-sub', parent_id: 'c-parent', parent: undefined },
          },
        ],
        total: 1,
      });
      mockRepository.getCategoriesByIds.mockResolvedValueOnce([
        { id: 'c-parent', name: 'Parent Category' },
      ]);

      const res = await service.getForumPosts({});
      expect(res.data[0].category?.parent).toEqual({
        id: 'c-parent',
        name: 'Parent Category',
      });
      expect(mockRepository.getCategoriesByIds).toHaveBeenCalledWith([
        'c-parent',
      ]);
    });

    it('should annotate liked_by_me in getForumPosts for authenticated user and unauthenticated user', async () => {
      mockRepository.getPosts.mockResolvedValueOnce({
        data: [{ id: 'post-1' }, { id: 'post-2' }],
        total: 2,
      });
      mockRepository.getPostLikes.mockResolvedValueOnce([
        { post_id: 'post-1' },
      ]);

      const authRes = await service.getForumPosts({}, 'usr-1');
      expect(authRes.data[0].liked_by_me).toBe(true);
      expect(authRes.data[1].liked_by_me).toBe(false);

      mockRepository.getPosts.mockResolvedValueOnce({
        data: [{ id: 'post-1' }],
        total: 1,
      });
      const anonRes = await service.getForumPosts({}, undefined);
      expect(anonRes.data[0].liked_by_me).toBe(false);
    });

    it('should return hot posts annotated with likes', async () => {
      mockRepository.getHotPosts.mockResolvedValueOnce([{ id: 'p-hot' }]);
      mockRepository.getPostLikes.mockResolvedValueOnce([{ post_id: 'p-hot' }]);

      const hot = await service.getHotPosts(5, 'usr-1');
      expect(hot[0].liked_by_me).toBe(true);
      expect(mockRepository.getHotPosts).toHaveBeenCalledWith(5);
    });

    it('should return null if post slug not found in getForumPost', async () => {
      mockRepository.getPostBySlug.mockResolvedValueOnce(null);
      const res = await service.getForumPost('missing-post');
      expect(res).toBeNull();
    });

    it('should generate unique slug and insert post', async () => {
      mockRepository.getPostSlugs.mockResolvedValueOnce([]);
      mockRepository.insertPost.mockResolvedValueOnce({
        id: 'post-1',
        title: 'New Topic',
        slug: 'new-topic',
      });

      const res = await service.createForumPost(
        { title: 'New Topic', content: 'Content body' },
        'discussion',
        'author-1',
      );

      expect(res.id).toBe('post-1');
      expect(mockRepository.insertPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Topic',
          slug: 'new-topic',
          author_id: 'author-1',
          post_type: 'discussion',
        }),
      );
    });

    it('should throw NotFoundException when updating non-existent post', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getPostById.mockResolvedValueOnce(null);

      await expect(
        service.updateForumPost('p-missing', { title: 'Update' }, 'usr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent non-author non-admin from updating post', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getPostById.mockResolvedValueOnce({
        id: 'post-1',
        author_id: 'author-999',
      });

      await expect(
        service.updateForumPost('post-1', { title: 'Updated' }, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow author or admin to update post', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getPostById.mockResolvedValueOnce({
        id: 'post-1',
        author_id: 'author-1',
      });
      mockRepository.updatePost.mockResolvedValueOnce({
        id: 'post-1',
        title: 'Updated Title',
      });

      const result = await service.updateForumPost(
        'post-1',
        { title: 'Updated Title' },
        'author-1',
      );
      expect(result.title).toBe('Updated Title');

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getPostById.mockResolvedValueOnce({
        id: 'post-1',
        author_id: 'author-other',
      });
      mockRepository.updatePost.mockResolvedValueOnce({
        id: 'post-1',
        title: 'Admin Edited',
      });

      const adminResult = await service.updateForumPost(
        'post-1',
        { title: 'Admin Edited' },
        'admin-1',
      );
      expect(adminResult.title).toBe('Admin Edited');
    });

    it('should throw NotFoundException when deleting non-existent post', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getPostById.mockResolvedValueOnce(null);

      await expect(
        service.deleteForumPost('p-missing', 'usr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow admin or author to delete post and block others', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getPostById.mockResolvedValueOnce({
        id: 'post-1',
        author_id: 'author-other',
      });

      await expect(service.deleteForumPost('post-1', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );

      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getPostById.mockResolvedValueOnce({
        id: 'post-1',
        author_id: 'author-1',
      });
      mockRepository.deletePost.mockResolvedValueOnce(undefined);

      const deleteRes = await service.deleteForumPost('post-1', 'author-1');
      expect(deleteRes).toEqual({ success: true });
    });

    it('should gracefully handle RPC errors in incrementPostView', async () => {
      mockRepository.incrementPostView.mockRejectedValueOnce(
        new Error('RPC function failed'),
      );

      const res = await service.incrementPostView('post-1');
      expect(res).toEqual({ success: true });
    });

    it('should enforce admin role for setPinned', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(service.setPinned('post-1', true, 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updatePostPinned.mockResolvedValueOnce(undefined);

      const res = await service.setPinned('post-1', true, 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.updatePostPinned).toHaveBeenCalledWith(
        'post-1',
        true,
      );
    });

    it('should enforce admin role for setRemoved', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(
        service.setRemoved('post', 'post-1', true, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.setRemoved.mockResolvedValueOnce(undefined);

      const res = await service.setRemoved('post', 'post-1', true, 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.setRemoved).toHaveBeenCalledWith(
        'forum_posts',
        'post-1',
        true,
      );
    });
  });

  describe('Comment in-place editing & Bookmarks delegation', () => {
    it('should update forum comment when user is author', async () => {
      mockRepository.getCommentById.mockResolvedValueOnce({
        id: 'c-1',
        author_id: 'user-1',
        body: 'Old text',
      });
      mockRepository.updateComment.mockResolvedValueOnce({
        id: 'c-1',
        body: 'New text',
      });

      const res = await service.updateForumComment('c-1', 'New text', 'user-1');
      expect(mockRepository.updateComment).toHaveBeenCalledWith('c-1', {
        body: 'New text',
        content: 'New text',
      });
      expect(res.body).toBe('New text');
    });

    it('should reject unauthorized comment update with ForbiddenException', async () => {
      mockRepository.getCommentById.mockResolvedValueOnce({
        id: 'c-1',
        author_id: 'user-1',
        body: 'Old text',
      });
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.updateForumComment('c-1', 'Hacked text', 'user-2'),
      ).rejects.toThrow();
    });

    it('should toggle bookmark on post from unbookmarked to bookmarked and vice-versa', async () => {
      mockRepository.getPostById.mockResolvedValue({ id: 'p-1' });
      mockRepository.checkBookmark.mockResolvedValueOnce(false);
      mockRepository.insertBookmark.mockResolvedValueOnce(undefined);

      const res1 = await service.togglePostBookmark('p-1', 'user-1');
      expect(res1).toEqual({ bookmarked: true });

      mockRepository.checkBookmark.mockResolvedValueOnce(true);
      mockRepository.deleteBookmark.mockResolvedValueOnce(undefined);

      const res2 = await service.togglePostBookmark('p-1', 'user-1');
      expect(res2).toEqual({ bookmarked: false });
    });

    it('should retrieve user bookmarks', async () => {
      mockRepository.getUserBookmarks.mockResolvedValueOnce([
        { id: 'p-1', title: 'Saved post' },
      ]);

      const res = await service.getUserBookmarks('user-1');
      expect(mockRepository.getUserBookmarks).toHaveBeenCalledWith('user-1');
      expect(res[0].bookmarked_by_me).toBe(true);
    });
  });

  describe('Comments operations', () => {
    it('should get comments and annotate with likes', async () => {
      mockRepository.getComments.mockResolvedValueOnce([
        { id: 'c-1', post_id: 'p-1' },
      ]);
      mockRepository.getCommentLikes.mockResolvedValueOnce([
        { comment_id: 'c-1' },
      ]);

      const comments = await service.getForumComments(
        'p-1',
        { includeRemoved: true },
        'usr-1',
      );
      expect(comments[0].liked_by_me).toBe(true);
      expect(mockRepository.getComments).toHaveBeenCalledWith('p-1', true);
    });

    it('should create comment with parentId support', async () => {
      mockRepository.insertComment.mockResolvedValueOnce({
        id: 'c-new',
        post_id: 'p-1',
        body: 'Reply',
        parent_id: 'c-parent',
      });

      const res = await service.createForumComment(
        'p-1',
        'Reply',
        'usr-1',
        'c-parent',
      );
      expect(res.id).toBe('c-new');
      expect(mockRepository.insertComment).toHaveBeenCalledWith(
        expect.objectContaining({
          post_id: 'p-1',
          author_id: 'usr-1',
          body: 'Reply',
          parent_id: 'c-parent',
        }),
      );
    });

    it('should throw NotFoundException if comment does not exist when deleting', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getCommentById.mockResolvedValueOnce(null);

      await expect(
        service.deleteForumComment('c-missing', 'usr-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent non-author non-admin from deleting comment', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getCommentById.mockResolvedValueOnce({
        id: 'c-1',
        author_id: 'author-other',
      });

      await expect(service.deleteForumComment('c-1', 'usr-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow author to delete comment', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getCommentById.mockResolvedValueOnce({
        id: 'c-1',
        author_id: 'author-1',
      });
      mockRepository.deleteComment.mockResolvedValueOnce(undefined);

      const res = await service.deleteForumComment('c-1', 'author-1');
      expect(res).toEqual({ success: true });
    });

    it('should require admin for getRemovedComments', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(service.getRemovedComments(10, 'usr-1')).rejects.toThrow(
        UnauthorizedException,
      );

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getRemovedComments.mockResolvedValueOnce([
        { id: 'c-rem', is_removed: true },
      ]);
      const res = await service.getRemovedComments(10, 'admin-1');
      expect(res).toHaveLength(1);
    });
  });

  describe('Likes operations', () => {
    it('should toggle post like from unliked to liked and vice-versa', async () => {
      mockRepository.checkPostLike.mockResolvedValueOnce(null);
      mockRepository.insertPostLike.mockResolvedValueOnce(undefined);

      const res1 = await service.togglePostLike('post-1', 'usr-1');
      expect(res1).toEqual({ liked: true });

      mockRepository.checkPostLike.mockResolvedValueOnce({ post_id: 'post-1' });
      mockRepository.deletePostLike.mockResolvedValueOnce(undefined);

      const res2 = await service.togglePostLike('post-1', 'usr-1');
      expect(res2).toEqual({ liked: false });
    });

    it('should toggle comment like from unliked to liked and vice-versa', async () => {
      mockRepository.checkCommentLike.mockResolvedValueOnce(null);
      mockRepository.insertCommentLike.mockResolvedValueOnce(undefined);

      const res1 = await service.toggleCommentLike('c-1', 'usr-1');
      expect(res1).toEqual({ liked: true });

      mockRepository.checkCommentLike.mockResolvedValueOnce({
        comment_id: 'c-1',
      });
      mockRepository.deleteCommentLike.mockResolvedValueOnce(undefined);

      const res2 = await service.toggleCommentLike('c-1', 'usr-1');
      expect(res2).toEqual({ liked: false });
    });
  });

  describe('Events operations', () => {
    it('should require admin for unpublished events query', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.getForumEvents({ includeUnpublished: true }, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return events with RSVP annotation', async () => {
      mockRepository.getEvents.mockResolvedValueOnce([{ id: 'evt-1' }]);
      mockRepository.getEventRsvps.mockResolvedValueOnce([
        { event_id: 'evt-1' },
      ]);

      const events = await service.getForumEvents({}, 'usr-1');
      expect(events[0].going_by_me).toBe(true);
    });

    it('should return null for getForumEvent when event not found', async () => {
      mockRepository.getEventBySlug.mockResolvedValueOnce(null);
      const res = await service.getForumEvent('missing-evt');
      expect(res).toBeNull();
    });

    it('should require admin to create, update, and delete events', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(
        service.createForumEvent(
          { title: 'Evt', event_date: '2026-09-01' },
          'usr-1',
        ),
      ).rejects.toThrow(UnauthorizedException);

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getEventSlugs.mockResolvedValueOnce([]);
      mockRepository.insertEvent.mockResolvedValueOnce({
        id: 'evt-1',
        title: 'Evt',
      });
      const created = await service.createForumEvent(
        { title: 'Evt', event_date: '2026-09-01' },
        'admin-1',
      );
      expect(created.id).toBe('evt-1');

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateEvent.mockResolvedValueOnce({
        id: 'evt-1',
        title: 'Updated Evt',
      });
      const updated = await service.updateForumEvent(
        'evt-1',
        { title: 'Updated Evt' },
        'admin-1',
      );
      expect(updated.title).toBe('Updated Evt');

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.deleteEvent.mockResolvedValueOnce(undefined);
      const deleted = await service.deleteForumEvent('evt-1', 'admin-1');
      expect(deleted).toEqual({ success: true });
    });

    it('should get event attendees mapped with profile data and sorted by rsvp_at', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getEventRsvpAttendees.mockResolvedValueOnce([
        {
          user_id: 'usr-1',
          contact_phone: '+90555',
          created_at: '2026-08-20T10:00:00Z',
        },
        {
          user_id: 'usr-2',
          contact_phone: null,
          created_at: '2026-08-21T10:00:00Z',
        },
      ]);
      mockRepository.getProfilesByIds.mockResolvedValueOnce([
        { id: 'usr-2', full_name: 'Bob' },
        { id: 'usr-1', full_name: 'Alice' },
      ]);

      const attendees = await service.getEventAttendees('evt-1', 'admin-1');
      expect(attendees).toHaveLength(2);
      expect(attendees[0].id).toBe('usr-1');
      expect(attendees[0].full_name).toBe('Alice');
      expect(attendees[0].contact_phone).toBe('+90555');
      expect(attendees[1].id).toBe('usr-2');
      expect(attendees[1].full_name).toBe('Bob');
    });

    it('should return empty array if event has no attendees', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getEventRsvpAttendees.mockResolvedValueOnce([]);

      const attendees = await service.getEventAttendees('evt-1', 'admin-1');
      expect(attendees).toEqual([]);
    });

    it('should toggle event RSVP', async () => {
      mockRepository.checkEventRsvp.mockResolvedValueOnce(null);
      mockRepository.insertEventRsvp.mockResolvedValueOnce(undefined);

      const res = await service.toggleEventRsvp(
        'evt-1',
        '+905551234567',
        'usr-1',
      );
      expect(res).toEqual({ going: true });
      expect(mockRepository.insertEventRsvp).toHaveBeenCalledWith({
        event_id: 'evt-1',
        user_id: 'usr-1',
        contact_phone: '+905551234567',
      });

      mockRepository.checkEventRsvp.mockResolvedValueOnce({
        event_id: 'evt-1',
      });
      mockRepository.deleteEventRsvp.mockResolvedValueOnce(undefined);

      const res2 = await service.toggleEventRsvp('evt-1', null, 'usr-1');
      expect(res2).toEqual({ going: false });
    });
  });

  describe('Reports and Moderation', () => {
    it('should create violation report', async () => {
      mockRepository.insertReport.mockResolvedValueOnce(undefined);

      const res = await service.reportContent(
        { target_type: 'post', target_id: 'post-1', reason: 'spam' },
        'usr-1',
      );

      expect(res).toEqual({ success: true });
      expect(mockRepository.insertReport).toHaveBeenCalledWith({
        target_type: 'post',
        target_id: 'post-1',
        reporter_id: 'usr-1',
        reason: 'spam',
      });
    });

    it('should require admin to view reports and resolve reports', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(service.getForumReports(false, 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getReports.mockResolvedValueOnce([
        { id: 'rep-1', resolved: false },
      ]);
      const reports = await service.getForumReports(false, 'admin-1');
      expect(reports).toHaveLength(1);

      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(
        service.resolveForumReport('rep-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateReportResolved.mockResolvedValueOnce(undefined);
      const resolveRes = await service.resolveForumReport('rep-1', 'admin-1');
      expect(resolveRes).toEqual({ success: true });
    });
  });

  describe('Stats operations', () => {
    it('should return aggregated forum stats', async () => {
      const stats = await service.getForumStats();
      expect(stats).toEqual({
        totalTopics: 10,
        totalReplies: 25,
        usersOnline: 3,
        latestMember: 'Alice',
      });
    });
  });

  describe('Adversarial & Boundary Edge Cases', () => {
    it('should fallback to category slug when name contains no alphanumeric chars', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.insertCategory.mockResolvedValueOnce({
        id: 'cat-sym',
        name: '???',
        slug: 'category',
      });

      const res = await service.createForumCategory({ name: '???' }, 'admin-1');
      expect(mockRepository.insertCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '???',
          slug: 'category',
        }),
      );
      expect(res.slug).toBe('category');
    });

    it('should sanitize negative and excessive limits and offsets in getForumPosts', async () => {
      mockRepository.getPosts.mockResolvedValueOnce({ data: [], total: 0 });

      await service.getForumPosts({ limit: -10, offset: -5 });
      expect(mockRepository.getPosts).toHaveBeenCalledWith(
        expect.anything(),
        20, // defaulted from negative
        0, // defaulted from negative
      );

      mockRepository.getPosts.mockResolvedValueOnce({ data: [], total: 0 });
      await service.getForumPosts({ limit: 500, offset: 50 });
      expect(mockRepository.getPosts).toHaveBeenCalledWith(
        expect.anything(),
        100, // capped at 100
        50,
      );
    });

    it('should sanitize invalid and excessive limits in getHotPosts', async () => {
      mockRepository.getHotPosts.mockResolvedValueOnce([]);
      await service.getHotPosts(0);
      expect(mockRepository.getHotPosts).toHaveBeenCalledWith(8);

      mockRepository.getHotPosts.mockResolvedValueOnce([]);
      await service.getHotPosts(250);
      expect(mockRepository.getHotPosts).toHaveBeenCalledWith(100);
    });

    it('should sanitize limits in getRemovedComments and getForumEvents', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getRemovedComments.mockResolvedValueOnce([]);
      await service.getRemovedComments(-5, 'admin-1');
      expect(mockRepository.getRemovedComments).toHaveBeenCalledWith(50);

      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getRemovedComments.mockResolvedValueOnce([]);
      await service.getRemovedComments(999, 'admin-1');
      expect(mockRepository.getRemovedComments).toHaveBeenCalledWith(100);

      mockRepository.getEvents.mockResolvedValueOnce([]);
      await service.getForumEvents({ limit: 300 });
      expect(mockRepository.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
        expect.any(String),
      );

      mockRepository.getEvents.mockResolvedValueOnce([]);
      await service.getForumEvents({ limit: -10 });
      expect(mockRepository.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 }),
        expect.any(String),
      );

      mockRepository.getEvents.mockResolvedValueOnce([]);
      await service.getForumEvents({ limit: 0 });
      expect(mockRepository.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 }),
        expect.any(String),
      );
    });

    it('should trim title, description, and location in updateForumEvent', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateEvent.mockResolvedValueOnce({
        id: 'evt-1',
        title: 'Trimmed Title',
        description: 'Trimmed Desc',
        location: 'Trimmed Loc',
      });

      const res = await service.updateForumEvent(
        'evt-1',
        {
          title: '  Trimmed Title  ',
          description: '  Trimmed Desc  ',
          location: '  Trimmed Loc  ',
        },
        'admin-1',
      );

      expect(res.id).toBe('evt-1');
      expect(mockRepository.updateEvent).toHaveBeenCalledWith(
        'evt-1',
        expect.objectContaining({
          title: 'Trimmed Title',
          description: 'Trimmed Desc',
          location: 'Trimmed Loc',
        }),
      );
    });

    it('should handle concurrent post like race condition (duplicate key error 23505) gracefully', async () => {
      mockRepository.checkPostLike.mockResolvedValueOnce(null);
      mockRepository.insertPostLike.mockRejectedValueOnce(
        new Error(
          'duplicate key value violates unique constraint "forum_post_likes_pkey" (SQLSTATE 23505)',
        ),
      );

      const res = await service.togglePostLike('post-1', 'usr-1');
      expect(res).toEqual({ liked: true });
    });

    it('should rethrow unexpected database errors in togglePostLike', async () => {
      mockRepository.checkPostLike.mockResolvedValueOnce(null);
      mockRepository.insertPostLike.mockRejectedValueOnce(
        new Error('connection timeout'),
      );

      await expect(service.togglePostLike('post-1', 'usr-1')).rejects.toThrow(
        'connection timeout',
      );
    });

    it('should handle concurrent comment like race condition (duplicate key error 23505) gracefully', async () => {
      mockRepository.checkCommentLike.mockResolvedValueOnce(null);
      mockRepository.insertCommentLike.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint (23505)'),
      );

      const res = await service.toggleCommentLike('c-1', 'usr-1');
      expect(res).toEqual({ liked: true });
    });

    it('should handle concurrent event RSVP race condition gracefully', async () => {
      mockRepository.checkEventRsvp.mockResolvedValueOnce(null);
      mockRepository.insertEventRsvp.mockRejectedValueOnce(
        new Error('unique constraint violation'),
      );

      const res = await service.toggleEventRsvp('evt-1', '+90555', 'usr-1');
      expect(res).toEqual({ going: true });
    });

    it('should return attendee with null profile info when profile row does not exist', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getEventRsvpAttendees.mockResolvedValueOnce([
        {
          user_id: 'usr-ghost',
          contact_phone: '+905550000000',
          created_at: '2026-08-21T12:00:00Z',
        },
      ]);
      mockRepository.getProfilesByIds.mockResolvedValueOnce([]); // No profile returned

      const attendees = await service.getEventAttendees('evt-1', 'admin-1');
      expect(attendees).toHaveLength(1);
      expect(attendees[0].id).toBe('usr-ghost');
      expect(attendees[0].full_name).toBeNull();
      expect(attendees[0].avatar_url).toBeNull();
      expect(attendees[0].contact_phone).toBe('+905550000000');
    });
  });
});
