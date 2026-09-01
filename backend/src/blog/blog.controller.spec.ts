import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';

jest.mock('sanitize-html', () => {
  return jest.fn((dirty: string) => dirty || '');
});

import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  BlogPost,
  BlogPostSummary,
  BlogSubmission,
  BlogTag,
} from './types/blog.types';
import {
  CreateBlogPostDto,
  CreateBlogSubmissionDto,
  CreateBlogTagDto,
  GetBlogCommentsQueryDto,
  GetBlogQueryDto,
  GetBlogSubmissionsQueryDto,
  RejectBlogSubmissionDto,
  UpdateBlogPostDto,
} from './dto';

type MockServiceType = {
  [K in keyof BlogService]: jest.Mock;
};

describe('BlogController', () => {
  let controller: BlogController;
  let mockService: MockServiceType;

  const mockBlogPost: BlogPost = {
    id: 'post-1',
    title: 'Test Post',
    slug: 'test-post',
    content: 'Content here',
    excerpt: 'Excerpt here',
    cover_image_url: 'https://example.com/cover.jpg',
    video_url: null,
    category: 'Guides',
    status: 'published',
    is_featured: false,
    author_id: 'user-1',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockBlogPostSummary: BlogPostSummary = {
    id: 'post-1',
    title: 'Test Post',
    slug: 'test-post',
    excerpt: 'Excerpt here',
    cover_image_url: 'https://example.com/cover.jpg',
    category: 'Guides',
    published_at: new Date().toISOString(),
  };

  const mockBlogTag: BlogTag = {
    id: 'tag-1',
    name: 'Alanya Castle',
    slug: 'alanya-castle',
  };

  const mockSubmission: BlogSubmission = {
    id: 'sub-1',
    user_id: 'user-1',
    title: 'Submission 1',
    content: 'Content',
    status: 'pending_review',
    created_at: new Date().toISOString(),
  };

  const mockUser: AuthUser = {
    id: 'user-1',
    email: 'user@test.com',
  };

  beforeEach(async () => {
    mockService = {
      getBlogPosts: jest.fn().mockResolvedValue({
        data: [mockBlogPost],
        total: 1,
      }),
      getFeaturedBlogPosts: jest.fn().mockResolvedValue([mockBlogPostSummary]),
      getBlogTags: jest.fn().mockResolvedValue([mockBlogTag]),
      createBlogTag: jest.fn().mockResolvedValue(mockBlogTag),
      deleteBlogTag: jest.fn().mockResolvedValue({ success: true }),
      getBlogSubmissions: jest.fn().mockResolvedValue([mockSubmission]),
      getUserBlogSubmissions: jest.fn().mockResolvedValue([mockSubmission]),
      getUserBlogPosts: jest.fn().mockResolvedValue({
        data: [mockBlogPost],
        total: 1,
      }),
      updateUserBlogSubmission: jest.fn().mockResolvedValue(mockSubmission),
      resubmitUserBlogSubmission: jest.fn().mockResolvedValue({
        ...mockSubmission,
        status: 'pending_review',
      }),
      createBlogSubmission: jest.fn().mockResolvedValue({
        submissionId: 'sub-1',
      }),
      approveBlogSubmission: jest.fn().mockResolvedValue(mockBlogPost),
      rejectBlogSubmission: jest.fn().mockResolvedValue({ success: true }),
      getBlogPost: jest.fn().mockResolvedValue(mockBlogPost),
      getRelatedPosts: jest.fn().mockResolvedValue([mockBlogPostSummary]),
      createBlogPost: jest.fn().mockResolvedValue(mockBlogPost),
      updateBlogPost: jest.fn().mockResolvedValue(mockBlogPost),
      deleteBlogPost: jest.fn().mockResolvedValue({ success: true }),
      addTagToPost: jest.fn().mockResolvedValue({ success: true }),
      removeTagFromPost: jest.fn().mockResolvedValue({ success: true }),
      getBlogComments: jest.fn().mockResolvedValue([]),
      createBlogComment: jest.fn().mockResolvedValue({
        id: 'comment-1',
        post_id: 'post-1',
        user_id: 'user-1',
        body: 'Great post!',
        parent_id: null,
        like_count: 0,
        is_removed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      updateBlogComment: jest.fn().mockResolvedValue({
        id: 'comment-1',
        post_id: 'post-1',
        user_id: 'user-1',
        body: 'Updated comment',
        parent_id: null,
        like_count: 0,
        is_removed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      deleteBlogComment: jest.fn().mockResolvedValue({ success: true }),
      toggleBlogCommentLike: jest.fn().mockResolvedValue({ liked: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        {
          provide: BlogService,
          useValue: mockService,
        },
        {
          provide: UserRolesRepository,
          useValue: { getRole: jest.fn().mockResolvedValue('admin') },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BlogController>(BlogController);
  });

  describe('GET /blog endpoints', () => {
    it.each(['getBlogPosts', 'getBlogPost', 'getBlogComments'] as const)(
      'should protect %s with OptionalAuthGuard',
      (methodName) => {
        const handler = Object.getOwnPropertyDescriptor(
          BlogController.prototype,
          methodName,
        )?.value as object;
        const guards = Reflect.getMetadata(
          GUARDS_METADATA,
          handler,
        ) as unknown[];

        expect(guards).toContain(OptionalAuthGuard);
      },
    );

    it('should delegate getBlogPosts call to service with optional user ID', async () => {
      const query: GetBlogQueryDto = { category: 'news', page: 1, limit: 10 };
      const user: AuthUser = { id: 'user-1' };
      const res = await controller.getBlogPosts(query, user);

      expect(res.total).toBe(1);
      expect(mockService.getBlogPosts).toHaveBeenCalledWith(query, 'user-1');
    });

    it('should have route path metadata supporting both /blog and /blog/posts', () => {
      const paths = Reflect.getMetadata(
        'path',
        BlogController.prototype.getBlogPosts,
      );
      const isArrayWithPosts = Array.isArray(paths) && paths.includes('posts');
      const isPosts = paths === 'posts';
      expect(isArrayWithPosts || isPosts).toBe(true);
    });

    it('should delegate getBlogPosts call to service with undefined user when unauthenticated', async () => {
      const query: GetBlogQueryDto = { category: 'news', page: 1, limit: 10 };
      const res = await controller.getBlogPosts(query, undefined);

      expect(res.total).toBe(1);
      expect(mockService.getBlogPosts).toHaveBeenCalledWith(query, undefined);
    });

    it('should delegate getFeaturedBlogPosts with limit parameter', async () => {
      const res = await controller.getFeaturedBlogPosts({ limit: 5 });
      expect(res).toHaveLength(1);
      expect(mockService.getFeaturedBlogPosts).toHaveBeenCalledWith(5);
    });

    it('should delegate getBlogPost with incrementViews flag and authenticated user ID', async () => {
      const res = await controller.getBlogPost('test-slug', 'false', mockUser);
      expect(res.slug).toBe('test-post');
      expect(mockService.getBlogPost).toHaveBeenCalledWith(
        'test-slug',
        false,
        'user-1',
      );
    });

    it('should forward no user ID for an anonymous or invalid optional identity', async () => {
      await controller.getBlogPost('test-slug', undefined, undefined);

      expect(mockService.getBlogPost).toHaveBeenCalledWith(
        'test-slug',
        true,
        undefined,
      );
    });

    it('should delegate getRelatedPosts with category and limit', async () => {
      const res = await controller.getRelatedPosts('post-1', 'Guides', {
        limit: 4,
      });
      expect(res).toHaveLength(1);
      expect(mockService.getRelatedPosts).toHaveBeenCalledWith(
        'post-1',
        'Guides',
        4,
      );
    });

    it('should forward valid and absent identities when reading comments', async () => {
      const query: GetBlogCommentsQueryDto = { limit: 10, offset: 0 };

      await controller.getBlogComments('post-1', query, mockUser);
      expect(mockService.getBlogComments).toHaveBeenLastCalledWith(
        'post-1',
        query,
        'user-1',
      );

      await controller.getBlogComments('post-1', query, undefined);
      expect(mockService.getBlogComments).toHaveBeenLastCalledWith(
        'post-1',
        query,
        undefined,
      );
    });
  });

  describe('Tags endpoints', () => {
    it('should delegate getBlogTags', async () => {
      const res = await controller.getBlogTags();
      expect(res).toHaveLength(1);
      expect(mockService.getBlogTags).toHaveBeenCalled();
    });

    it('should delegate createBlogTag with DTO', async () => {
      const dto: CreateBlogTagDto = { name: 'New Tag' };
      const res = await controller.createBlogTag(dto, mockUser);
      expect(res.name).toBe('Alanya Castle');
      expect(mockService.createBlogTag).toHaveBeenCalledWith(
        'New Tag',
        'user-1',
      );
    });

    it('should delegate deleteBlogTag', async () => {
      const res = await controller.deleteBlogTag('tag-1', mockUser);
      expect(res.success).toBe(true);
      expect(mockService.deleteBlogTag).toHaveBeenCalledWith('tag-1', 'user-1');
    });

    it('should delegate addTagToPost and removeTagFromPost', async () => {
      await controller.addTagToPost('post-1', 'tag-1', mockUser);
      expect(mockService.addTagToPost).toHaveBeenCalledWith(
        'post-1',
        'tag-1',
        'user-1',
      );

      await controller.removeTagFromPost('post-1', 'tag-1', mockUser);
      expect(mockService.removeTagFromPost).toHaveBeenCalledWith(
        'post-1',
        'tag-1',
        'user-1',
      );
    });
  });

  describe('Submissions endpoints', () => {
    it('should delegate createBlogSubmission with req.user.id', async () => {
      const dto: CreateBlogSubmissionDto = {
        title: 'New Submission',
        content: 'Content text',
        author_name: 'Author',
        author_email: 'author@test.com',
      };
      const res = await controller.createBlogSubmission(dto, mockUser);
      expect(res.submissionId).toBe('sub-1');
      expect(mockService.createBlogSubmission).toHaveBeenCalledWith(
        dto,
        'user-1',
      );
    });

    it('should delegate getBlogSubmissions for admin', async () => {
      const query: GetBlogSubmissionsQueryDto = { status: 'pending_review' };
      const res = await controller.getBlogSubmissions(query, mockUser);
      expect(res).toHaveLength(1);
      expect(mockService.getBlogSubmissions).toHaveBeenCalledWith(
        query,
        'user-1',
      );
    });

    it('should delegate paginated getUserBlogSubmissions for current user', async () => {
      const query: GetBlogSubmissionsQueryDto = { limit: 10, offset: 20 };
      const res = await controller.getUserBlogSubmissions(query, mockUser);
      expect(res).toHaveLength(1);
      expect(mockService.getUserBlogSubmissions).toHaveBeenCalledWith(
        query,
        'user-1',
      );
    });

    it('should delegate approveBlogSubmission', async () => {
      const res = await controller.approveBlogSubmission('sub-1', mockUser);
      expect(res.id).toBe('post-1');
      expect(mockService.approveBlogSubmission).toHaveBeenCalledWith(
        'sub-1',
        'user-1',
      );
    });

    it('should delegate rejectBlogSubmission', async () => {
      const dto: RejectBlogSubmissionDto = {
        reason: 'Content does not meet guidelines',
      };
      const res = await controller.rejectBlogSubmission('sub-1', dto, mockUser);
      expect(res.success).toBe(true);
      expect(mockService.rejectBlogSubmission).toHaveBeenCalledWith(
        'sub-1',
        dto.reason,
        'user-1',
      );
    });
  });

  describe('Post CRUD endpoints', () => {
    it('should delegate createBlogPost', async () => {
      const dto: CreateBlogPostDto = {
        title: 'Post Title',
        content: 'Post Content',
      };
      const res = await controller.createBlogPost(dto, mockUser);
      expect(res.id).toBe('post-1');
      expect(mockService.createBlogPost).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should delegate updateBlogPost', async () => {
      const dto: UpdateBlogPostDto = {
        title: 'Updated Title',
      };
      const res = await controller.updateBlogPost('post-1', dto, mockUser);
      expect(res.id).toBe('post-1');
      expect(mockService.updateBlogPost).toHaveBeenCalledWith(
        'post-1',
        dto,
        'user-1',
      );
    });

    it('should delegate deleteBlogPost', async () => {
      const res = await controller.deleteBlogPost('post-1', mockUser);
      expect(res.success).toBe(true);
      expect(mockService.deleteBlogPost).toHaveBeenCalledWith(
        'post-1',
        'user-1',
      );
    });
  });
});
