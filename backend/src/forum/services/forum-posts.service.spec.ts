import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ForumPostsService } from './forum-posts.service';
import { ForumPostsRepository } from '../repositories/forum-posts.repository';

describe('ForumPostsService', () => {
  let service: ForumPostsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      getUserRole: jest.fn(),
      getPostSlugs: jest.fn().mockResolvedValue([]),
      getCategoriesByIds: jest.fn().mockResolvedValue([]),
      getPostLikes: jest.fn().mockResolvedValue([]),
      getCommentLikes: jest.fn().mockResolvedValue([]),
      getCategoryBySlug: jest.fn(),
      getChildCategories: jest.fn().mockResolvedValue([]),
      getPosts: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getHotPosts: jest.fn().mockResolvedValue([]),
      getPostBySlug: jest.fn(),
      insertPost: jest.fn(),
      updatePost: jest.fn(),
      getPostOwner: jest.fn(),
      deletePost: jest.fn(),
      incrementPostView: jest.fn(),
      togglePostLike: jest.fn().mockResolvedValue({ liked: true }),
      updatePostPinned: jest.fn().mockResolvedValue({}),
      setRemoved: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumPostsService,
        {
          provide: ForumPostsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ForumPostsService>(ForumPostsService);
  });

  describe('getForumPosts', () => {
    it('should throw error if both removedOnly and includeRemoved are specified', async () => {
      await expect(
        service.getForumPosts({ removedOnly: true, includeRemoved: true }),
      ).rejects.toThrow('Cannot specify both removedOnly and includeRemoved');
    });

    it('should return empty list if specified categorySlug is not found', async () => {
      mockRepository.getCategoryBySlug.mockResolvedValueOnce(null);

      const res = await service.getForumPosts({ categorySlug: 'non-existent' });
      expect(res).toEqual({ data: [], total: 0 });
    });
  });

  describe('createForumPost', () => {
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
  });

  describe('setPinned', () => {
    it('should throw UnauthorizedException if requester is not admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.setPinned('post-1', true, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call updatePostPinned on repository when requester is admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
      mockRepository.updatePostPinned.mockResolvedValueOnce({ id: 'post-1' });

      const res = await service.setPinned('post-1', true, 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.updatePostPinned).toHaveBeenCalledWith('post-1', true);
    });
  });
});
