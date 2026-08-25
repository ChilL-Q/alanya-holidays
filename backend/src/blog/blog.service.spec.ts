import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

jest.mock('sanitize-html', () => {
  return jest.fn((dirty: string) =>
    dirty ? dirty.replace(/<script.*?>.*?<\/script>/gi, '') : '',
  );
});

import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { ModerationAuditService } from '../admin/moderation-audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailOutboxRepository } from '../bookings/email-outbox.repository';
import {
  BlogPost,
  BlogPostSummary,
  BlogTag,
  InsertBlogPostPayload,
  RawBlogPostRow,
} from './types/blog.types';
import {
  CreateBlogPostDto,
  CreateBlogSubmissionDto,
  GetBlogQueryDto,
  GetBlogSubmissionsQueryDto,
  UpdateBlogPostDto,
} from './dto';

type MockRepositoryType = {
  [K in keyof BlogRepository]: jest.Mock;
};

describe('BlogService', () => {
  let service: BlogService;
  let mockRepository: MockRepositoryType;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let notificationsService: { notifyUser: jest.Mock; notifyAdmins: jest.Mock };
  let emailOutbox: { enqueue: jest.Mock };

  const mockBlogPost: BlogPost = {
    id: 'post-1',
    title: 'Title',
    slug: 'title',
    content: '<p>Content</p>',
    excerpt: 'Content',
    cover_image_url: 'https://example.com/image.jpg',
    video_url: null,
    category: 'Travel',
    status: 'published',
    is_featured: false,
    author_id: 'author-1',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockRawRow: RawBlogPostRow = {
    id: 'post-1',
    title: 'Title',
    slug: 'title',
    content: '<p>Content</p>',
    excerpt: 'Content',
    cover_image_url: 'https://example.com/image.jpg',
    video_url: null,
    category: 'Travel',
    status: 'published',
    is_featured: false,
    author_id: 'author-1',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [{ tag: { id: 'tag-1', name: 'Nature', slug: 'nature' } }],
  };

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };

    mockRepository = {
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
      getBlogComments: jest.fn(),
    } as unknown as MockRepositoryType;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: BlogRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
        {
          provide: ModerationAuditService,
          useValue: {
            logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyUser: jest.fn().mockResolvedValue({ id: 'n-1' }),
            notifyAdmins: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: EmailOutboxRepository,
          useValue: {
            enqueue: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    notificationsService = module.get(NotificationsService);
    emailOutbox = module.get(EmailOutboxRepository);
  });

  describe('getBlogPosts', () => {
    it('should query posts with pagination and flatten tags', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getBlogPosts.mockResolvedValueOnce({
        data: [mockRawRow],
        count: 1,
      });

      const filters: GetBlogQueryDto = {
        page: 2,
        limit: 5,
        category: 'Travel',
      };
      const result = await service.getBlogPosts(filters, 'user-1');

      expect(result.total).toBe(1);
      expect(result.data[0].tags).toEqual([
        { id: 'tag-1', name: 'Nature', slug: 'nature' },
      ]);
      expect(mockRepository.getBlogPosts).toHaveBeenCalledWith(
        filters,
        5,
        5,
        'user',
        'user-1',
      );
    });

    it('should use default pagination and anon role when no user', async () => {
      mockRepository.getBlogPosts.mockResolvedValueOnce({
        data: [],
        count: 0,
      });

      const result = await service.getBlogPosts({});
      expect(result.total).toBe(0);
      expect(mockRepository.getBlogPosts).toHaveBeenCalledWith(
        {},
        10,
        0,
        'anon',
        undefined,
      );
    });
  });

  describe('getFeaturedBlogPosts', () => {
    it('should return featured blog posts', async () => {
      const summary: BlogPostSummary = {
        id: 'post-1',
        title: 'Title',
        slug: 'title',
        excerpt: 'Excerpt',
        cover_image_url: null,
        category: 'Travel',
        published_at: '2026-01-01',
      };
      mockRepository.getFeaturedBlogPosts.mockResolvedValueOnce([summary]);

      const result = await service.getFeaturedBlogPosts(3);
      expect(result).toEqual([summary]);
      expect(mockRepository.getFeaturedBlogPosts).toHaveBeenCalledWith(3);
    });
  });

  describe('getBlogPost', () => {
    it('should throw NotFoundException if post does not exist', async () => {
      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(null);

      await expect(service.getBlogPost('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return post and increment views if status is published', async () => {
      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(mockRawRow);

      const result = await service.getBlogPost('title', true);

      expect(result.tags).toEqual([
        { id: 'tag-1', name: 'Nature', slug: 'nature' },
      ]);
      expect(mockRepository.incrementBlogViews).toHaveBeenCalledWith('post-1');
    });

    it('should not increment views if incrementViews is false', async () => {
      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(mockRawRow);

      await service.getBlogPost('title', false);
      expect(mockRepository.incrementBlogViews).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when public user tries to view draft post', async () => {
      const draftPost = {
        ...mockRawRow,
        status: 'draft',
        author_id: 'user-author',
      };
      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(draftPost);
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.getBlogPost('title', false, 'other-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow admin or author to view draft post', async () => {
      const draftPost = {
        ...mockRawRow,
        status: 'draft',
        author_id: 'user-author',
      };
      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(draftPost);
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      const adminResult = await service.getBlogPost(
        'title',
        false,
        'admin-user',
      );
      expect(adminResult.id).toBe(draftPost.id);

      mockRepository.getBlogPostBySlug.mockResolvedValueOnce(draftPost);
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      const authorResult = await service.getBlogPost(
        'title',
        false,
        'user-author',
      );
      expect(authorResult.id).toBe(draftPost.id);
    });
  });

  describe('getRelatedPosts', () => {
    it('should delegate getRelatedPosts to repository', async () => {
      mockRepository.getRelatedPosts.mockResolvedValueOnce([]);
      const result = await service.getRelatedPosts('post-1', 'Travel', 4);
      expect(result).toEqual([]);
      expect(mockRepository.getRelatedPosts).toHaveBeenCalledWith(
        'post-1',
        'Travel',
        4,
      );
    });
  });

  describe('createBlogPost', () => {
    it('should generate unique slug and insert post with tags', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getSlugs.mockResolvedValueOnce([]);
      mockRepository.insertBlogPost.mockResolvedValueOnce(mockBlogPost);

      const dto: CreateBlogPostDto = {
        title: 'New Post',
        content: '<p>Hello</p>',
        status: 'draft',
        tag_ids: ['tag-1', 'tag-2'],
      };

      const result = await service.createBlogPost(dto, 'author-1');

      expect(result.id).toBe('post-1');
      expect(mockRepository.insertBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Post',
          slug: 'new-post',
          author_id: 'author-1',
          status: 'draft',
        }),
      );
      expect(mockRepository.insertBlogPostTags).toHaveBeenCalledWith([
        { post_id: 'post-1', tag_id: 'tag-1' },
        { post_id: 'post-1', tag_id: 'tag-2' },
      ]);
    });

    it('should resolve conflicting slug by incrementing counter', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getSlugs.mockResolvedValueOnce([
        'test-post',
        'test-post-1',
      ]);
      mockRepository.insertBlogPost.mockResolvedValueOnce({
        ...mockBlogPost,
        slug: 'test-post-2',
      });

      const dto: CreateBlogPostDto = {
        title: 'Test Post',
        content: '<p>Hello</p>',
        status: 'published',
        is_featured: true,
      };

      const result = await service.createBlogPost(dto, 'admin-1');
      expect(result.slug).toBe('test-post-2');
      expect(mockRepository.insertBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test-post-2',
          is_featured: true,
        }),
      );
    });

    it('should correctly transliterate Turkish diacritics into ASCII without stripping characters', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getSlugs.mockResolvedValueOnce([]);
      mockRepository.insertBlogPost.mockImplementationOnce(
        (payload: InsertBlogPostPayload) =>
          Promise.resolve({
            ...mockBlogPost,
            title: payload.title,
            slug: payload.slug,
          }),
      );

      const dto: CreateBlogPostDto = {
        title: 'İstanbul Çeşme & Şile Rehberi',
        content: '<p>Gezi rehberi</p>',
        status: 'published',
      };

      const result = await service.createBlogPost(dto, 'user-1');
      expect(result.slug).toBe('istanbul-cesme-sile-rehberi');
      expect(mockRepository.insertBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'istanbul-cesme-sile-rehberi',
        }),
      );
    });
  });

  describe('updateBlogPost', () => {
    it('should throw NotFoundException if post not found', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getBlogPostById.mockResolvedValueOnce(null);

      const dto: UpdateBlogPostDto = { title: 'Updated' };
      await expect(
        service.updateBlogPost('post-99', dto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if not owner or admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getBlogPostById.mockResolvedValueOnce({
        author_id: 'other-user',
        status: 'published',
        slug: 'slug',
      });

      const dto: UpdateBlogPostDto = { title: 'Updated' };
      await expect(
        service.updateBlogPost('post-1', dto, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow admin to update post, featured status and update tags', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getBlogPostById.mockResolvedValueOnce({
        author_id: 'other-user',
        status: 'draft',
        slug: 'old-slug',
      });
      mockRepository.getSlugs.mockResolvedValueOnce([]);
      mockRepository.updateBlogPost.mockResolvedValueOnce({
        ...mockBlogPost,
        title: 'New Title',
      });

      const dto: UpdateBlogPostDto = {
        title: 'New Title',
        status: 'published',
        is_featured: true,
        tag_ids: ['tag-3'],
      };

      const result = await service.updateBlogPost('post-1', dto, 'admin-1');

      expect(result.title).toBe('New Title');
      expect(mockRepository.updateBlogPost).toHaveBeenCalledWith(
        'post-1',
        expect.objectContaining({
          title: 'New Title',
          status: 'published',
          is_featured: true,
        }),
      );
      expect(mockRepository.deleteBlogPostTags).toHaveBeenCalledWith('post-1');
      expect(mockRepository.insertBlogPostTags).toHaveBeenCalledWith([
        { post_id: 'post-1', tag_id: 'tag-3' },
      ]);
    });
  });

  describe('deleteBlogPost', () => {
    it('should throw UnauthorizedException if non-admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      await expect(service.deleteBlogPost('post-1', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete post when admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      const res = await service.deleteBlogPost('post-1', 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.deleteBlogPost).toHaveBeenCalledWith('post-1');
    });
  });

  describe('Tags management', () => {
    it('should get all tags', async () => {
      const tag: BlogTag = { id: 'tag-1', name: 'Beaches', slug: 'beaches' };
      mockRepository.getBlogTags.mockResolvedValueOnce([tag]);

      const result = await service.getBlogTags();
      expect(result).toEqual([tag]);
    });

    it('should create tag if admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.insertBlogTag.mockResolvedValueOnce({
        id: 'tag-2',
        name: 'Historic Sites',
        slug: 'historic-sites',
      });

      const res = await service.createBlogTag('Historic Sites', 'admin-1');
      expect(res.slug).toBe('historic-sites');
    });

    it('should delete tag if admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      const res = await service.deleteBlogTag('tag-2', 'admin-1');
      expect(res.success).toBe(true);
      expect(mockRepository.deleteBlogTag).toHaveBeenCalledWith('tag-2');
    });

    it('should add and remove tag to post when owner', async () => {
      mockUserRolesRepo.getRole.mockResolvedValue('user');
      mockRepository.getBlogPostById.mockResolvedValue({
        author_id: 'user-1',
        status: 'draft',
        slug: 'slug',
      });

      const addRes = await service.addTagToPost('post-1', 'tag-1', 'user-1');
      expect(addRes.success).toBe(true);
      expect(mockRepository.insertSingleBlogPostTag).toHaveBeenCalledWith(
        'post-1',
        'tag-1',
      );

      const removeRes = await service.removeTagFromPost(
        'post-1',
        'tag-1',
        'user-1',
      );
      expect(removeRes.success).toBe(true);
      expect(mockRepository.deleteSingleBlogPostTag).toHaveBeenCalledWith(
        'post-1',
        'tag-1',
      );
    });
  });

  describe('createBlogSubmission', () => {
    it('should throw BadRequestException if submission limit exceeded', async () => {
      mockRepository.checkBlogSubmissionLimit.mockResolvedValueOnce(false);

      const dto: CreateBlogSubmissionDto = {
        title: 'My Story',
        content: 'Story content',
      };
      await expect(service.createBlogSubmission(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should sanitize content and insert submission', async () => {
      mockRepository.checkBlogSubmissionLimit.mockResolvedValueOnce(true);
      mockRepository.insertBlogSubmission.mockResolvedValueOnce({
        id: 'sub-1',
      });

      const dto: CreateBlogSubmissionDto = {
        title: 'Story',
        content: '<script>alert(1)</script><p>Text</p>',
        author_name: 'Ruslan',
        author_email: 'ruslan@test.com',
        category: 'Guides',
      };

      const result = await service.createBlogSubmission(dto, 'user-1');

      expect(result).toEqual({ submissionId: 'sub-1' });
      expect(mockRepository.insertBlogSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '<p>Text</p>',
          author_name: 'Ruslan',
          author_email: 'ruslan@test.com',
          category: 'Guides',
        }),
      );
    });
  });

  describe('getBlogSubmissions', () => {
    it('should query submissions if admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getBlogSubmissions.mockResolvedValueOnce([]);

      const query: GetBlogSubmissionsQueryDto = { status: 'pending_review' };
      const res = await service.getBlogSubmissions(query, 'admin-1');
      expect(res).toEqual([]);
      expect(mockRepository.getBlogSubmissions).toHaveBeenCalledWith(query);
    });

    it('should get current user submissions', async () => {
      mockRepository.getUserBlogSubmissions.mockResolvedValueOnce([]);
      const res = await service.getUserBlogSubmissions('user-1');
      expect(res).toEqual([]);
      expect(mockRepository.getUserBlogSubmissions).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  describe('approveBlogSubmission', () => {
    it('should throw UnauthorizedException if non-admin attempts approval', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.approveBlogSubmission('sub-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should approve submission, create post, and send notification', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getBlogSubmissionById.mockResolvedValueOnce({
        id: 'sub-1',
        user_id: 'author-1',
        title: 'Submitted Title',
        content: 'Submitted Content',
        status: 'pending_review',
        media_urls: ['https://example.com/cover.jpg'],
      });
      mockRepository.updateBlogSubmissionStatus.mockResolvedValueOnce([
        { id: 'sub-1' },
      ]);
      mockRepository.getSlugs.mockResolvedValueOnce([]);
      mockRepository.insertBlogPost.mockResolvedValueOnce({
        id: 'post-1',
        title: 'Submitted Title',
        slug: 'submitted-title',
      });
      mockRepository.getProfileForNotification.mockResolvedValueOnce({
        email: 'author@test.com',
        full_name: 'Author Name',
      });

      const result = await service.approveBlogSubmission('sub-1', 'admin-1');

      expect(result.id).toBe('post-1');
      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'author-1',
        expect.objectContaining({
          title: 'Blog Post Published!',
          type: 'success',
        }),
      );
      expect(emailOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'author@test.com',
          type: 'blog_submission_approved',
        }),
      );
    });

    it('should persist submission category in insertBlogPost during approval', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getBlogSubmissionById.mockResolvedValueOnce({
        id: 'sub-category-1',
        user_id: 'author-1',
        title: 'Food Guide Story',
        content: 'Delicious food in Alanya',
        category: 'Food & Drink',
        status: 'pending_review',
        media_urls: ['https://example.com/food.jpg'],
      });
      mockRepository.updateBlogSubmissionStatus.mockResolvedValueOnce([
        { id: 'sub-category-1' },
      ]);
      mockRepository.getSlugs.mockResolvedValueOnce([]);
      mockRepository.insertBlogPost.mockResolvedValueOnce({
        id: 'post-food-1',
        title: 'Food Guide Story',
        slug: 'food-guide-story',
        category: 'Food & Drink',
      });
      mockRepository.getProfileForNotification.mockResolvedValueOnce({
        email: 'author@test.com',
        full_name: 'Foodie Author',
      });

      await service.approveBlogSubmission('sub-category-1', 'admin-1');

      expect(mockRepository.insertBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Food Guide Story',
          category: 'Food & Drink',
        }),
      );
    });

    it('should rollback submission status if post insertion fails', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getBlogSubmissionById.mockResolvedValueOnce({
        id: 'sub-1',
        user_id: 'author-1',
        title: 'Submitted Title',
        content: 'Submitted Content',
        status: 'pending_review',
      });
      mockRepository.updateBlogSubmissionStatus.mockResolvedValueOnce([
        { id: 'sub-1' },
      ]);
      mockRepository.getSlugs.mockResolvedValueOnce([]);
      mockRepository.insertBlogPost.mockRejectedValueOnce(
        new Error('DB Insert Error'),
      );

      await expect(
        service.approveBlogSubmission('sub-1', 'admin-1'),
      ).rejects.toThrow('DB Insert Error');

      expect(mockRepository.updateBlogSubmissionStatus).toHaveBeenCalledWith(
        'sub-1',
        'pending_review',
        'approved',
      );
    });
  });

  describe('rejectBlogSubmission', () => {
    it('should throw BadRequestException if reason is too short', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      await expect(
        service.rejectBlogSubmission('sub-1', 'short', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject submission, update status, and send notification', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getBlogSubmissionById.mockResolvedValueOnce({
        id: 'sub-1',
        user_id: 'author-1',
        title: 'Submitted Title',
        content: 'Submitted Content',
        status: 'pending_review',
      });
      mockRepository.updateBlogSubmissionStatus.mockResolvedValueOnce([
        { id: 'sub-1' },
      ]);
      mockRepository.getProfileForNotification.mockResolvedValueOnce({
        email: 'author@test.com',
        full_name: 'Author Name',
      });

      const res = await service.rejectBlogSubmission(
        'sub-1',
        'Content is not related to Alanya tourism.',
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(mockRepository.updateBlogSubmissionStatus).toHaveBeenCalledWith(
        'sub-1',
        'rejected',
        'pending_review',
        { rejection_reason: 'Content is not related to Alanya tourism.' },
      );
      expect(notificationsService.notifyUser).toHaveBeenCalledWith(
        'author-1',
        expect.objectContaining({
          title: 'Blog Post Rejected',
          type: 'error',
        }),
      );
      expect(emailOutbox.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'author@test.com',
          type: 'blog_submission_rejected',
        }),
      );
    });
  });

  describe('getBlogComments', () => {
    it('should delegate getBlogComments with postId and userId', async () => {
      mockRepository.getBlogComments.mockResolvedValueOnce([
        { id: 'c-1', post_id: 'p-1', body: 'Nice post', isLiked: true },
      ]);

      const res = await service.getBlogComments('p-1', 'user-1');
      expect(res).toHaveLength(1);
      expect(res[0].isLiked).toBe(true);
      expect(mockRepository.getBlogComments).toHaveBeenCalledWith(
        'p-1',
        'user-1',
      );
    });
  });
});
