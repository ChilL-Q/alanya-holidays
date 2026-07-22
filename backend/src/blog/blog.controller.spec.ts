import { Test, TestingModule } from '@nestjs/testing';

jest.mock('sanitize-html', () => {
  return jest.fn((dirty: string) => dirty || '');
});

import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { AuthGuard } from '../auth/auth.guard';

describe('BlogController', () => {
  let controller: BlogController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      getBlogPosts: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getFeaturedBlogPosts: jest.fn().mockResolvedValue([]),
      getBlogTags: jest.fn().mockResolvedValue([]),
      createBlogTag: jest.fn().mockResolvedValue({ id: 'tag-1' }),
      deleteBlogTag: jest.fn().mockResolvedValue({ success: true }),
      getBlogSubmissions: jest.fn().mockResolvedValue([]),
      getUserBlogSubmissions: jest.fn().mockResolvedValue([]),
      createBlogSubmission: jest.fn().mockResolvedValue({ submissionId: 'sub-1' }),
      approveBlogSubmission: jest.fn().mockResolvedValue({ id: 'post-1' }),
      rejectBlogSubmission: jest.fn().mockResolvedValue({ success: true }),
      getBlogPost: jest.fn().mockResolvedValue({ id: 'post-1', title: 'Post' }),
      getRelatedPosts: jest.fn().mockResolvedValue([]),
      createBlogPost: jest.fn().mockResolvedValue({ id: 'post-1' }),
      updateBlogPost: jest.fn().mockResolvedValue({ id: 'post-1' }),
      deleteBlogPost: jest.fn().mockResolvedValue({ success: true }),
      addTagToPost: jest.fn().mockResolvedValue({ success: true }),
      removeTagFromPost: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        {
          provide: BlogService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BlogController>(BlogController);
  });

  it('should delegate getBlogPosts call to service with optional user ID', async () => {
    const req = { user: { id: 'user-1' } };
    await controller.getBlogPosts({ category: 'news' }, req);
    expect(mockService.getBlogPosts).toHaveBeenCalledWith(
      { category: 'news' },
      'user-1',
    );
  });

  it('should delegate getFeaturedBlogPosts with limit parameter', async () => {
    await controller.getFeaturedBlogPosts('5');
    expect(mockService.getFeaturedBlogPosts).toHaveBeenCalledWith(5);
  });

  it('should delegate getBlogPost with incrementViews flag', async () => {
    await controller.getBlogPost('test-slug', 'false');
    expect(mockService.getBlogPost).toHaveBeenCalledWith('test-slug', false);
  });

  it('should delegate createBlogSubmission with req.user.id', async () => {
    const req = { user: { id: 'user-2' } };
    await controller.createBlogSubmission({ title: 'New Submission' }, req);
    expect(mockService.createBlogSubmission).toHaveBeenCalledWith(
      { title: 'New Submission' },
      'user-2',
    );
  });
});
