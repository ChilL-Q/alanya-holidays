import { Test, TestingModule } from '@nestjs/testing';
import { ForumPostsController } from './forum-posts.controller';
import { ForumPostsService } from '../services/forum-posts.service';
import { AuthGuard } from '../../auth/auth.guard';

describe('ForumPostsController', () => {
  let controller: ForumPostsController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      getForumPosts: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getHotPosts: jest.fn().mockResolvedValue([]),
      getForumPost: jest.fn().mockResolvedValue({ id: 'post-1' }),
      createForumPost: jest.fn().mockResolvedValue({ id: 'post-1' }),
      updateForumPost: jest.fn().mockResolvedValue({ id: 'post-1' }),
      deleteForumPost: jest.fn().mockResolvedValue({ success: true }),
      incrementPostView: jest.fn().mockResolvedValue({ success: true }),
      togglePostLike: jest.fn().mockResolvedValue({ liked: true }),
      setPinned: jest.fn().mockResolvedValue({ success: true }),
      setRemoved: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForumPostsController],
      providers: [
        {
          provide: ForumPostsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ForumPostsController>(ForumPostsController);
  });

  it('should parse query parameters in getForumPosts', async () => {
    const req = { user: { id: 'usr-10' } };
    await controller.getForumPosts(
      { categorySlug: 'tips', limit: '10', offset: '20' },
      req,
    );

    expect(mockService.getForumPosts).toHaveBeenCalledWith(
      expect.objectContaining({
        categorySlug: 'tips',
        limit: 10,
        offset: 20,
      }),
      'usr-10',
    );
  });

  it('should pass post_type discussion to createForumPost when calling createForumPost', async () => {
    const req = { user: { id: 'usr-10' } };
    const body = { title: 'New Question' };
    await controller.createForumPost(body, req);

    expect(mockService.createForumPost).toHaveBeenCalledWith(
      body,
      'discussion',
      'usr-10',
    );
  });

  it('should pass post_type question to createForumPost when calling createQuestionPost', async () => {
    const req = { user: { id: 'usr-10' } };
    const body = { title: 'Need Help' };
    await controller.createQuestionPost(body, req);

    expect(mockService.createForumPost).toHaveBeenCalledWith(
      body,
      'question',
      'usr-10',
    );
  });

  it('should pass req.user.id to setPinned', async () => {
    const req = { user: { id: 'admin-1' } };
    await controller.setPinned('post-1', true, req);

    expect(mockService.setPinned).toHaveBeenCalledWith('post-1', true, 'admin-1');
  });
});
