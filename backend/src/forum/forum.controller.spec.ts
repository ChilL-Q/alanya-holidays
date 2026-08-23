import { Test, TestingModule } from '@nestjs/testing';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  CreateForumPostDto,
  GetForumPostsQueryDto,
  UpdateForumPostDto,
} from './dto/forum-posts.dto';
import {
  CreateForumCategoryDto,
  UpdateForumCategoryDto,
} from './dto/forum-categories.dto';
import {
  CreateForumEventDto,
  GetForumEventsQueryDto,
  UpdateForumEventDto,
} from './dto/forum-events.dto';
import { CreateForumCommentDto } from './dto/forum-comments.dto';

describe('ForumController', () => {
  let controller: ForumController;
  let mockService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockService = {
      getForumCategories: jest.fn().mockResolvedValue([]),
      getForumCategoryTree: jest.fn().mockResolvedValue([]),
      getForumCategory: jest.fn().mockResolvedValue({ id: 'cat-1' }),
      createForumCategory: jest.fn().mockResolvedValue({ id: 'cat-1' }),
      updateForumCategory: jest.fn().mockResolvedValue({ id: 'cat-1' }),
      deleteForumCategory: jest.fn().mockResolvedValue({ success: true }),

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

      getForumComments: jest.fn().mockResolvedValue([]),
      createForumComment: jest.fn().mockResolvedValue({ id: 'comment-1' }),
      deleteForumComment: jest.fn().mockResolvedValue({ success: true }),
      toggleCommentLike: jest.fn().mockResolvedValue({ liked: true }),

      getForumEvents: jest.fn().mockResolvedValue([]),
      getForumEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      createForumEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      updateForumEvent: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      deleteForumEvent: jest.fn().mockResolvedValue({ success: true }),
      getEventAttendees: jest.fn().mockResolvedValue([]),
      toggleEventRsvp: jest.fn().mockResolvedValue({ going: true }),

      getForumStats: jest.fn().mockResolvedValue({ totalTopics: 5 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForumController],
      providers: [
        {
          provide: ForumService,
          useValue: mockService,
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

    controller = module.get<ForumController>(ForumController);
  });

  describe('Categories routes', () => {
    it('should delegate getForumCategories and getForumCategoryTree', async () => {
      await controller.getForumCategories();
      expect(mockService.getForumCategories).toHaveBeenCalled();

      await controller.getForumCategoryTree();
      expect(mockService.getForumCategoryTree).toHaveBeenCalled();
    });

    it('should delegate getForumCategory by slug', async () => {
      const res = await controller.getForumCategory('living');
      expect(res).toEqual({ id: 'cat-1' });
      expect(mockService.getForumCategory).toHaveBeenCalledWith('living');
    });

    it('should delegate category creation with userId', async () => {
      const user: AuthUser = { id: 'admin-1' };
      const body: CreateForumCategoryDto = { name: 'Alanya Events' };
      await controller.createForumCategory(body, user);

      expect(mockService.createForumCategory).toHaveBeenCalledWith(
        body,
        'admin-1',
      );
    });

    it('should delegate category update and deletion', async () => {
      const user: AuthUser = { id: 'admin-1' };
      const body: UpdateForumCategoryDto = { name: 'Updated' };
      await controller.updateForumCategory('cat-1', body, user);
      expect(mockService.updateForumCategory).toHaveBeenCalledWith(
        'cat-1',
        body,
        'admin-1',
      );

      const delRes = await controller.deleteForumCategory('cat-1', user);
      expect(delRes).toEqual({ success: true });
      expect(mockService.deleteForumCategory).toHaveBeenCalledWith(
        'cat-1',
        'admin-1',
      );
    });
  });

  describe('Posts routes', () => {
    it('should parse query parameters in getForumPosts', async () => {
      const user: AuthUser = { id: 'usr-10' };
      const query: GetForumPostsQueryDto = {
        categorySlug: 'tips',
        limit: 10,
        offset: 20,
        includeRemoved: true,
        removedOnly: false,
      };
      await controller.getForumPosts(query, user);

      expect(mockService.getForumPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          categorySlug: 'tips',
          limit: 10,
          offset: 20,
          includeRemoved: true,
          removedOnly: false,
        }),
        'usr-10',
      );
    });

    it('should parse query parameters in getForumPosts and handle unauthenticated request', async () => {
      const query: GetForumPostsQueryDto = {
        categorySlug: 'tips',
        limit: 10,
        offset: 20,
      };
      await controller.getForumPosts(query, undefined);

      expect(mockService.getForumPosts).toHaveBeenCalledWith(
        expect.objectContaining({
          categorySlug: 'tips',
          limit: 10,
          offset: 20,
        }),
        undefined,
      );
    });

    it('should delegate getHotPosts and getForumPost with and without user', async () => {
      const user: AuthUser = { id: 'usr-1' };
      await controller.getHotPosts('12', user);
      expect(mockService.getHotPosts).toHaveBeenCalledWith(12, 'usr-1');

      await controller.getHotPosts('12', undefined);
      expect(mockService.getHotPosts).toHaveBeenCalledWith(12, undefined);

      await controller.getForumPost('my-post-slug', user);
      expect(mockService.getForumPost).toHaveBeenCalledWith(
        'my-post-slug',
        'usr-1',
      );

      await controller.getForumPost('my-post-slug', undefined);
      expect(mockService.getForumPost).toHaveBeenCalledWith(
        'my-post-slug',
        undefined,
      );
    });

    it('should delegate createForumPost with post_type discussion', async () => {
      const user: AuthUser = { id: 'usr-10' };
      const body: CreateForumPostDto = { title: 'New Question' };
      await controller.createForumPost(body, user);

      expect(mockService.createForumPost).toHaveBeenCalledWith(
        body,
        'discussion',
        'usr-10',
      );
    });

    it('should delegate createQuestionPost with post_type question', async () => {
      const user: AuthUser = { id: 'usr-10' };
      const body: CreateForumPostDto = { title: 'Need Help' };
      await controller.createQuestionPost(body, user);

      expect(mockService.createForumPost).toHaveBeenCalledWith(
        body,
        'question',
        'usr-10',
      );
    });

    it('should delegate updateForumPost and deleteForumPost', async () => {
      const user: AuthUser = { id: 'usr-1' };
      const body: UpdateForumPostDto = { title: 'New' };
      await controller.updateForumPost('p-1', body, user);
      expect(mockService.updateForumPost).toHaveBeenCalledWith(
        'p-1',
        body,
        'usr-1',
      );

      await controller.deleteForumPost('p-1', user);
      expect(mockService.deleteForumPost).toHaveBeenCalledWith('p-1', 'usr-1');
    });

    it('should delegate incrementPostView and togglePostLike', async () => {
      const user: AuthUser = { id: 'usr-1' };
      await controller.incrementPostView('p-1');
      expect(mockService.incrementPostView).toHaveBeenCalledWith('p-1');

      await controller.togglePostLike('p-1', user);
      expect(mockService.togglePostLike).toHaveBeenCalledWith('p-1', 'usr-1');
    });

    it('should delegate setPinned and setPostRemoved with object or boolean payload', async () => {
      const user: AuthUser = { id: 'admin-1' };
      await controller.setPinned('p-1', { pinned: true }, user);
      expect(mockService.setPinned).toHaveBeenCalledWith(
        'p-1',
        true,
        'admin-1',
      );

      await controller.setPinned('p-1', false, user);
      expect(mockService.setPinned).toHaveBeenCalledWith(
        'p-1',
        false,
        'admin-1',
      );

      await controller.setPostRemoved('p-1', { removed: true }, user);
      expect(mockService.setRemoved).toHaveBeenCalledWith(
        'post',
        'p-1',
        true,
        'admin-1',
      );
    });
  });

  describe('Comments routes', () => {
    it('should delegate getForumComments and createForumComment', async () => {
      const user: AuthUser = { id: 'usr-1' };
      await controller.getForumComments('p-1', { includeRemoved: true }, user);
      expect(mockService.getForumComments).toHaveBeenCalledWith(
        'p-1',
        { includeRemoved: true },
        'usr-1',
      );

      await controller.getForumComments(
        'p-1',
        { includeRemoved: false },
        undefined,
      );
      expect(mockService.getForumComments).toHaveBeenCalledWith(
        'p-1',
        { includeRemoved: false },
        undefined,
      );

      const body: CreateForumCommentDto = {
        content: 'Nice post',
        parentId: 'c-parent',
      };
      await controller.createForumComment('p-1', body, user);
      expect(mockService.createForumComment).toHaveBeenCalledWith(
        'p-1',
        'Nice post',
        'usr-1',
        'c-parent',
      );
    });

    it('should delegate deleteForumComment, toggleCommentLike, and setCommentRemoved', async () => {
      const user: AuthUser = { id: 'usr-1' };
      await controller.deleteForumComment('c-1', user);
      expect(mockService.deleteForumComment).toHaveBeenCalledWith(
        'c-1',
        'usr-1',
      );

      await controller.toggleCommentLike('c-1', user);
      expect(mockService.toggleCommentLike).toHaveBeenCalledWith(
        'c-1',
        'usr-1',
      );

      await controller.setCommentRemoved('c-1', { removed: true }, user);
      expect(mockService.setRemoved).toHaveBeenCalledWith(
        'comment',
        'c-1',
        true,
        'usr-1',
      );
    });
  });

  describe('Events routes', () => {
    it('should delegate getForumEvents with parsed query with and without user', async () => {
      const user: AuthUser = { id: 'usr-1' };
      const query: GetForumEventsQueryDto = {
        upcomingOnly: true,
        limit: 15,
        includeUnpublished: false,
        search: 'Beach',
      };
      await controller.getForumEvents(query, user);
      expect(mockService.getForumEvents).toHaveBeenCalledWith(
        {
          upcomingOnly: true,
          limit: 15,
          includeUnpublished: false,
          search: 'Beach',
        },
        'usr-1',
      );

      await controller.getForumEvents(query, undefined);
      expect(mockService.getForumEvents).toHaveBeenCalledWith(
        {
          upcomingOnly: true,
          limit: 15,
          includeUnpublished: false,
          search: 'Beach',
        },
        undefined,
      );
    });

    it('should delegate getForumEvent by slug with and without user', async () => {
      const user: AuthUser = { id: 'usr-1' };
      await controller.getForumEvent('beach-cleanup', user);
      expect(mockService.getForumEvent).toHaveBeenCalledWith(
        'beach-cleanup',
        'usr-1',
      );

      await controller.getForumEvent('beach-cleanup', undefined);
      expect(mockService.getForumEvent).toHaveBeenCalledWith(
        'beach-cleanup',
        undefined,
      );
    });

    it('should delegate event create, update, delete, and getAttendees', async () => {
      const user: AuthUser = { id: 'admin-1' };
      const createBody: CreateForumEventDto = {
        title: 'New Meetup',
        event_date: '2026-09-01',
      };
      await controller.createForumEvent(createBody, user);
      expect(mockService.createForumEvent).toHaveBeenCalledWith(
        createBody,
        'admin-1',
      );

      const updateBody: UpdateForumEventDto = { title: 'Updated' };
      await controller.updateForumEvent('evt-1', updateBody, user);
      expect(mockService.updateForumEvent).toHaveBeenCalledWith(
        'evt-1',
        updateBody,
        'admin-1',
      );

      await controller.deleteForumEvent('evt-1', user);
      expect(mockService.deleteForumEvent).toHaveBeenCalledWith(
        'evt-1',
        'admin-1',
      );

      await controller.getEventAttendees('evt-1', user);
      expect(mockService.getEventAttendees).toHaveBeenCalledWith(
        'evt-1',
        'admin-1',
      );
    });

    it('should delegate event rsvp with contact phone object and string', async () => {
      const user: AuthUser = { id: 'usr-1' };
      await controller.toggleEventRsvp(
        'evt-1',
        { contactPhone: '+905551112233' },
        user,
      );
      expect(mockService.toggleEventRsvp).toHaveBeenCalledWith(
        'evt-1',
        '+905551112233',
        'usr-1',
      );

      await controller.toggleEventRsvp(
        'evt-1',
        '+905559998877' as unknown as { contactPhone?: string | null },
        user,
      );
      expect(mockService.toggleEventRsvp).toHaveBeenCalledWith(
        'evt-1',
        '+905559998877',
        'usr-1',
      );
    });
  });

  describe('Stats route', () => {
    it('should delegate getForumStats', async () => {
      const res = await controller.getForumStats();
      expect(res).toEqual({ totalTopics: 5 });
      expect(mockService.getForumStats).toHaveBeenCalled();
    });
  });
});
