import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';

jest.mock('sanitize-html', () => {
  return jest.fn((dirty: string) =>
    dirty ? dirty.replace(/<script.*?>.*?<\/script>/gi, '') : '',
  );
});

import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';

describe('BlogService', () => {
  let service: BlogService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      getUserRole: jest.fn(),
      getSlugs: jest.fn().mockResolvedValue([]),
      getBlogPosts: jest.fn(),
      getFeaturedBlogPosts: jest.fn(),
      getBlogPostBySlug: jest.fn(),
      incrementBlogViews: jest.fn(),
      getRelatedPosts: jest.fn(),
      insertBlogPost: jest.fn(),
      insertBlogPostTags: jest.fn(),
      getBlogPostById: jest.fn(),
      updateBlogPost: jest.fn(),
      deleteBlogPostTags: jest.fn(),
      deleteBlogPost: jest.fn(),
      getBlogTags: jest.fn(),
      insertBlogTag: jest.fn(),
      deleteBlogTag: jest.fn(),
      insertSingleBlogPostTag: jest.fn(),
      deleteSingleBlogPostTag: jest.fn(),
      checkBlogSubmissionLimit: jest.fn(),
      insertBlogSubmission: jest.fn(),
      getBlogSubmissions: jest.fn(),
      getUserBlogSubmissions: jest.fn(),
      getBlogSubmissionById: jest.fn(),
      updateBlogSubmissionStatus: jest.fn(),
      getProfileForNotification: jest.fn(),
      insertNotification: jest.fn(),
      invokeEmailFunction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: BlogRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
  });

  describe('getBlogPost', () => {
    it('should throw NotFoundException if post does not exist', async () => {
      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(null);

      await expect(service.getBlogPost('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return post and increment views if status is published', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Title',
        status: 'published',
        tags: [{ tag: 'nature' }],
      };
      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(mockPost);

      const result = await service.getBlogPost('title', true);

      expect(result.tags).toEqual(['nature']);
      expect(mockRepository.incrementBlogViews).toHaveBeenCalledWith('post-1');
    });
  });

  describe('createBlogPost', () => {
    it('should generate unique slug and insert post', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');
      mockRepository.getSlugs.mockResolvedValueOnce([]);
      mockRepository.insertBlogPost.mockResolvedValueOnce({
        id: 'post-100',
        title: 'New Post',
        slug: 'new-post',
      });

      const result = await service.createBlogPost(
        { title: 'New Post', content: '<p>Hello</p>', status: 'draft' },
        'author-1',
      );

      expect(result.id).toBe('post-100');
      expect(mockRepository.insertBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Post',
          slug: 'new-post',
          author_id: 'author-1',
        }),
      );
    });
  });

  describe('createBlogSubmission', () => {
    it('should throw BadRequestException if submission limit exceeded', async () => {
      mockRepository.checkBlogSubmissionLimit.mockResolvedValueOnce(false);

      await expect(
        service.createBlogSubmission({ title: 'My Story' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize content and insert submission', async () => {
      mockRepository.checkBlogSubmissionLimit.mockResolvedValueOnce(true);
      mockRepository.insertBlogSubmission.mockResolvedValueOnce({ id: 'sub-1' });

      const result = await service.createBlogSubmission(
        { title: 'Story', content: '<script>alert(1)</script><p>Text</p>' },
        'user-1',
      );

      expect(result).toEqual({ submissionId: 'sub-1' });
      expect(mockRepository.insertBlogSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '<p>Text</p>',
        }),
      );
    });
  });

  describe('approveBlogSubmission', () => {
    it('should throw UnauthorizedException if non-admin attempts approval', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.approveBlogSubmission('sub-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should approve submission, create post, and send notification', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
      mockRepository.getBlogSubmissionById.mockResolvedValueOnce({
        id: 'sub-1',
        user_id: 'author-1',
        title: 'Submitted Title',
        content: 'Submitted Content',
        status: 'pending_review',
      });
      mockRepository.updateBlogSubmissionStatus.mockResolvedValueOnce([{ id: 'sub-1' }]);
      mockRepository.insertBlogPost.mockResolvedValueOnce({
        id: 'post-1',
        title: 'Submitted Title',
      });
      mockRepository.getProfileForNotification.mockResolvedValueOnce({
        email: 'author@test.com',
        full_name: 'Author Name',
      });

      const result = await service.approveBlogSubmission('sub-1', 'admin-1');

      expect(result.id).toBe('post-1');
      expect(mockRepository.insertNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'author-1',
          type: 'success',
        }),
      );
      expect(mockRepository.invokeEmailFunction).toHaveBeenCalled();
    });
  });
});
