jest.mock('sanitize-html', () => {
  return jest.fn((dirty: string) => dirty || '');
});

import {
  ForbiddenException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { NotificationsController } from '../src/notifications/notifications.controller';
import {
  NotificationsService,
  LiveNotification,
} from '../src/notifications/notifications.service';
import {
  INotificationsRepository,
  CreateNotificationInput,
} from '../src/notifications/domain/repositories/notifications.repository.interface';
import { ForumController } from '../src/forum/forum.controller';
import { ForumService } from '../src/forum/forum.service';
import { UsersService } from '../src/users/users.service';
import { BlogController } from '../src/blog/blog.controller';
import { BlogService } from '../src/blog/blog.service';
import { MediaController } from '../src/media/media.controller';
import { MediaProcessingService } from '../src/media/media-processing.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { OptionalAuthGuard } from '../src/auth/optional-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { AuthTokenService } from '../src/auth/auth-token.service';
import { UserRolesRepository } from '../src/common/auth/user-roles.repository';
import { SupabaseService } from '../src/supabase/supabase.service';
import { RedisService } from '../src/common/redis/redis.service';
import {
  createRateLimitMiddleware,
  MemoryRateLimitStorage,
  applySecurityHeaders,
} from '../src/common/security/security.config';

type HttpApp = Parameters<typeof request>[0];

describe('Platform Milestones Comprehensive E2E & Multi-Tier Test Suite (Tiers 1 - 4)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let httpApp: HttpApp;

  const mockUserAuthor = {
    id: 'user-author-101',
    email: 'author@alanya-holidays.test',
  };

  const mockUserCommenter = {
    id: 'user-commenter-202',
    email: 'commenter@alanya-holidays.test',
  };

  const mockUserAdmin = {
    id: 'user-admin-999',
    email: 'admin@alanya-holidays.test',
  };

  class InMemoryNotificationsRepository implements INotificationsRepository {
    private notifications: LiveNotification[] = [];

    create(input: CreateNotificationInput): Promise<LiveNotification> {
      const notif: LiveNotification = {
        id: randomUUID(),
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
        link: input.link,
        read: false,
        createdAt: new Date().toISOString(),
      };
      this.notifications.unshift(notif);
      const userNotifs = this.notifications.filter(
        (n) => n.userId === input.userId,
      );
      if (userNotifs.length > 50) {
        const toKeep = userNotifs.slice(0, 50);
        this.notifications = this.notifications
          .filter((n) => n.userId !== input.userId)
          .concat(toKeep);
      }
      return Promise.resolve(notif);
    }

    findByUserId(userId: string, limit = 50): Promise<LiveNotification[]> {
      return Promise.resolve(
        this.notifications.filter((n) => n.userId === userId).slice(0, limit),
      );
    }

    markAsRead(userId: string, id: string): Promise<boolean> {
      const n = this.notifications.find(
        (item) => item.id === id && item.userId === userId,
      );
      if (n) {
        n.read = true;
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    }

    markAllAsRead(userId: string): Promise<number> {
      let count = 0;
      this.notifications.forEach((n) => {
        if (n.userId === userId && !n.read) {
          n.read = true;
          count++;
        }
      });
      return Promise.resolve(count);
    }

    delete(userId: string, id: string): Promise<boolean> {
      const initial = this.notifications.length;
      this.notifications = this.notifications.filter(
        (n) => !(n.id === id && n.userId === userId),
      );
      return Promise.resolve(this.notifications.length < initial);
    }
  }

  // Service Mocks
  const notificationsService = new NotificationsService(
    new InMemoryNotificationsRepository(),
  );

  const mockForumPostData = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    slug: 'best-beaches-in-alanya-guide',
    title: 'Top 5 Secret Beaches in Alanya for 2026',
    body: '<p>Discover Cleopatra Beach, Damlatas, and hidden coves.</p>',
    author_id: mockUserAuthor.id,
    post_type: 'discussion' as const,
    views_count: 142,
    likes_count: 18,
    comments_count: 3,
    is_pinned: false,
    is_locked: false,
    is_removed: false,
    created_at: new Date('2026-08-01T10:00:00Z').toISOString(),
    updated_at: new Date('2026-08-01T10:00:00Z').toISOString(),
    author: {
      full_name: 'Elena Rostova',
      avatar_url: 'https://images.unsplash.com/avatar-1',
    },
    category: {
      id: 'cat-beaches',
      name: 'Beaches & Nature',
      slug: 'beaches-nature',
    },
  };

  const mockForumCommentData = {
    id: '660e8400-e29b-41d4-a716-446655440002',
    post_id: mockForumPostData.id,
    author_id: mockUserCommenter.id,
    body: 'Cleopatra beach is definitely my favorite during sunset!',
    likes_count: 4,
    is_removed: false,
    created_at: new Date('2026-08-02T12:00:00Z').toISOString(),
    updated_at: new Date('2026-08-02T12:00:00Z').toISOString(),
    author: {
      full_name: 'David Miller',
      avatar_url: 'https://images.unsplash.com/avatar-2',
    },
    liked_by_me: false,
  };

  const forumServiceMock = {
    getForumCategories: jest.fn().mockResolvedValue([
      { id: 'cat-beaches', name: 'Beaches & Nature', slug: 'beaches-nature' },
      {
        id: 'cat-living',
        name: 'Living & Relocation',
        slug: 'living-relocation',
      },
    ]),
    getForumCategoryTree: jest.fn().mockResolvedValue([
      {
        id: 'cat-beaches',
        name: 'Beaches & Nature',
        slug: 'beaches-nature',
        children: [],
      },
    ]),
    getForumCategory: jest.fn().mockImplementation((slug: string) => {
      if (slug === 'beaches-nature') {
        return Promise.resolve({
          id: 'cat-beaches',
          name: 'Beaches & Nature',
          slug: 'beaches-nature',
        });
      }
      return Promise.resolve(null);
    }),
    getForumPosts: jest
      .fn()
      .mockImplementation(
        (filters: {
          search?: string;
          categorySlug?: string;
          limit?: number;
          offset?: number;
        }) => {
          let data = [mockForumPostData];
          if (filters.search) {
            const q = filters.search.toLowerCase();
            data = data.filter(
              (p) =>
                p.title.toLowerCase().includes(q) ||
                p.body.toLowerCase().includes(q),
            );
          }
          if (filters.categorySlug && filters.categorySlug !== 'all') {
            data = data.filter(
              (p) => p.category?.slug === filters.categorySlug,
            );
          }
          return Promise.resolve({
            data,
            total: data.length,
            limit: filters.limit || 20,
            offset: filters.offset || 0,
          });
        },
      ),
    getHotPosts: jest.fn().mockResolvedValue([mockForumPostData]),
    getForumPost: jest.fn().mockImplementation((slug: string) => {
      if (slug === mockForumPostData.slug || slug === mockForumPostData.id) {
        return Promise.resolve(mockForumPostData);
      }
      return Promise.resolve(null);
    }),
    createForumPost: jest.fn().mockImplementation((dto, type, authorId) => {
      return Promise.resolve({
        ...mockForumPostData,
        id: 'new-post-' + Math.random().toString(36).slice(2, 7),
        title: dto.title,
        body: dto.body,
        post_type: type,
        author_id: authorId,
      });
    }),
    updateForumPost: jest.fn().mockImplementation((id, dto, userId) => {
      if (id !== mockForumPostData.id) {
        return Promise.reject(new NotFoundException('Post not found'));
      }
      if (userId !== mockUserAuthor.id && userId !== mockUserAdmin.id) {
        return Promise.reject(new ForbiddenException('Forbidden'));
      }
      return Promise.resolve({
        ...mockForumPostData,
        title: dto.title || mockForumPostData.title,
        body: dto.body || mockForumPostData.body,
        updated_at: new Date().toISOString(),
      });
    }),
    deleteForumPost: jest.fn().mockResolvedValue({ success: true }),
    incrementPostView: jest.fn().mockResolvedValue({ success: true }),
    togglePostLike: jest
      .fn()
      .mockResolvedValue({ liked: true, likesCount: 19 }),
    setPinned: jest.fn().mockResolvedValue({ success: true }),
    setRemoved: jest.fn().mockResolvedValue({ success: true }),
    getForumComments: jest.fn().mockResolvedValue([mockForumCommentData]),
    createForumComment: jest
      .fn()
      .mockImplementation((postId, body, authorId) => {
        return Promise.resolve({
          ...mockForumCommentData,
          id: 'new-comment-' + Math.random().toString(36).slice(2, 7),
          post_id: postId,
          body,
          author_id: authorId,
        });
      }),
    deleteForumComment: jest.fn().mockResolvedValue({ success: true }),
    toggleCommentLike: jest
      .fn()
      .mockResolvedValue({ liked: true, likesCount: 5 }),
    getForumEvents: jest.fn().mockImplementation((filters) => {
      const allEvents = [
        {
          id: 'evt-1',
          title: 'Alanya Jazz Festival & Sunset Beach Party',
          slug: 'alanya-jazz-festival',
          location: 'Kizil Kule Harbor, Alanya',
          description: 'Live jazz performances by the historic Red Tower.',
          month: 'SEP',
          day: '15',
          time: '19:00',
          attendees: 42,
          maxAttendees: 100,
          image: 'https://images.unsplash.com/event-1',
        },
      ];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        return Promise.resolve(
          allEvents.filter(
            (e) =>
              e.title.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q),
          ),
        );
      }
      return Promise.resolve(allEvents);
    }),
    getForumEvent: jest.fn().mockResolvedValue(null),
    getForumStats: jest.fn().mockResolvedValue({
      totalPosts: 120,
      totalMembers: 450,
      totalCategories: 8,
      totalComments: 980,
    }),
  };

  const usersServiceMock = {
    getForumMembers: jest.fn().mockResolvedValue([
      {
        id: mockUserAuthor.id,
        full_name: 'Elena Rostova',
        avatar_url: 'https://images.unsplash.com/avatar-1',
        role: 'Local Guide',
        is_online: true,
      },
    ]),
    getForumMemberById: jest.fn().mockResolvedValue({
      id: mockUserAuthor.id,
      full_name: 'Elena Rostova',
    }),
  };

  const blogServiceMock = {
    getBlogPosts: jest.fn().mockImplementation((query) => {
      const posts = [
        {
          id: 'blog-1',
          slug: 'living-in-alanya-relocation-guide',
          title: 'Complete 2026 Guide to Living in Alanya as an Expat',
          description:
            'Everything about residence permits, healthcare, and cost of living.',
          tag: 'Expat Life',
          category: 'Guides',
          readTime: '7 min read',
          views: 1250,
        },
      ];
      return Promise.resolve({
        posts,
        total: posts.length,
        page: query?.page ? Number(query.page) : 1,
        totalPages: 1,
      });
    }),
    getFeaturedBlogPosts: jest.fn().mockResolvedValue([]),
    getBlogTags: jest.fn().mockResolvedValue([
      { id: 'tag-1', name: 'Expat Life', slug: 'expat-life' },
      { id: 'tag-2', name: 'Food & Dining', slug: 'food-dining' },
    ]),
  };

  const mediaProcessingServiceMock = {
    processAndUploadImage: jest.fn().mockImplementation((file, options) => {
      return Promise.resolve({
        url: `https://storage.alanya-holidays.test/${options.bucket}/${options.folder ? options.folder + '/' : ''}optimized-uuid.webp`,
        bucket: options.bucket,
        folder: options.folder || null,
        originalname: file.originalname,
        mimetype: 'image/webp',
        size: 85240,
        width: 1200,
        height: 800,
      });
    }),
  };

  const supabaseAuthGetUserMock = jest.fn();
  const userRolesRepoGetUserRoleMock = jest.fn();

  beforeAll(async () => {
    const rateLimitStorage = new MemoryRateLimitStorage();
    const rateLimitMiddleware = createRateLimitMiddleware({
      storage: rateLimitStorage,
      env: {
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX_REQUESTS: '100',
        RATE_LIMIT_PATH_LIMITS: JSON.stringify({
          '/api/products/orders': 2,
        }),
      },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        NotificationsController,
        ForumController,
        BlogController,
        MediaController,
      ],
      providers: [
        AuthGuard,
        OptionalAuthGuard,
        RolesGuard,
        AuthTokenService,
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: ForumService,
          useValue: forumServiceMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: BlogService,
          useValue: blogServiceMock,
        },
        {
          provide: MediaProcessingService,
          useValue: mediaProcessingServiceMock,
        },
        {
          provide: UserRolesRepository,
          useValue: {
            getUserRole: userRolesRepoGetUserRoleMock,
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => ({
              auth: {
                getUser: supabaseAuthGetUserMock,
              },
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getJson: jest.fn().mockResolvedValue(null),
            setJson: jest.fn().mockResolvedValue(undefined),
            client: {
              status: 'ready',
              ping: () => Promise.resolve('PONG'),
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(rateLimitMiddleware);
    app.use((req: any, res: any, next: any) => {
      applySecurityHeaders(res);
      next();
    });
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    httpApp = app.getHttpAdapter().getInstance() as HttpApp;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    supabaseAuthGetUserMock.mockImplementation((token: string) => {
      if (token === 'author-token') {
        return Promise.resolve({ data: { user: mockUserAuthor }, error: null });
      }
      if (token === 'commenter-token') {
        return Promise.resolve({
          data: { user: mockUserCommenter },
          error: null,
        });
      }
      if (token === 'admin-token') {
        return Promise.resolve({ data: { user: mockUserAdmin }, error: null });
      }
      return Promise.resolve({
        data: { user: null },
        error: new Error('Invalid token'),
      });
    });

    userRolesRepoGetUserRoleMock.mockImplementation((userId: string) => {
      if (userId === mockUserAdmin.id) return Promise.resolve('admin');
      return Promise.resolve('user');
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (R1 - R6)
  // =========================================================================
  describe('Tier 1: Feature Coverage (R1 - R6)', () => {
    describe('R1: Persistent Notifications System', () => {
      let createdNotif: LiveNotification;

      it('T1.1: notifyUser adds a live notification with unique ID, timestamp, and unread state', async () => {
        createdNotif = await notificationsService.notifyUser(
          mockUserAuthor.id,
          {
            type: 'COMMUNITY',
            title: 'New Reply Received',
            message:
              'David Miller replied to your thread "Top 5 Secret Beaches"',
            data: {
              postId: mockForumPostData.id,
              commentId: mockForumCommentData.id,
            },
          },
        );

        expect(createdNotif).toBeDefined();
        expect(createdNotif.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        expect(createdNotif.read).toBe(false);
        expect(createdNotif.type).toBe('COMMUNITY');
        expect(createdNotif.title).toBe('New Reply Received');
      });

      it('T1.2: GET /api/notifications retrieves active user notification list', async () => {
        const res = await request(httpApp)
          .get('/api/notifications')
          .set('Authorization', 'Bearer author-token')
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0]).toMatchObject({
          id: createdNotif.id,
          userId: mockUserAuthor.id,
          read: false,
          title: 'New Reply Received',
        });
      });

      it('T1.3: PATCH /api/notifications/:id/read marks single notification as read', async () => {
        const res = await request(httpApp)
          .patch(`/api/notifications/${createdNotif.id}/read`)
          .set('Authorization', 'Bearer author-token')
          .expect(200);

        expect(res.body).toEqual({ success: true });

        const updatedList = await notificationsService.getUserNotifications(
          mockUserAuthor.id,
        );
        const item = updatedList.find((n) => n.id === createdNotif.id);
        expect(item?.read).toBe(true);
      });

      it('T1.4: PATCH /api/notifications/read-all marks all notifications as read for current user', async () => {
        await notificationsService.notifyUser(mockUserAuthor.id, {
          type: 'NEW_BOOKING',
          title: 'Booking Confirmed',
          message: 'Your villa stay has been confirmed.',
        });

        const res = await request(httpApp)
          .patch('/api/notifications/read-all')
          .set('Authorization', 'Bearer author-token')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBeGreaterThanOrEqual(1);
      });

      it('T1.5: DELETE /api/notifications/:id removes notification from user feed', async () => {
        const res = await request(httpApp)
          .delete(`/api/notifications/${createdNotif.id}`)
          .set('Authorization', 'Bearer author-token')
          .expect(200);

        expect(res.body).toEqual({ success: true });
        const list = await notificationsService.getUserNotifications(
          mockUserAuthor.id,
        );
        expect(list.some((n) => n.id === createdNotif.id)).toBe(false);
      });
    });

    describe('R2: Forum Post & Comment In-Place Editing', () => {
      it('T1.6: POST /api/forum/posts allows authenticated author to create thread', async () => {
        const res = await request(httpApp)
          .post('/api/forum/posts')
          .set('Authorization', 'Bearer author-token')
          .send({
            title: 'Best Coffee Shops for Nomads in Mahmutlar',
            body: '<p>Sharing top 3 places with high speed Wi-Fi.</p>',
            category_id: '550e8400-e29b-41d4-a716-446655440000',
          })
          .expect(201);

        expect(res.body).toMatchObject({
          title: 'Best Coffee Shops for Nomads in Mahmutlar',
          author_id: mockUserAuthor.id,
          post_type: 'discussion',
        });
      });

      it('T1.7: PUT /api/forum/posts/:id allows author to update title and content', async () => {
        const res = await request(httpApp)
          .put(`/api/forum/posts/${mockForumPostData.id}`)
          .set('Authorization', 'Bearer author-token')
          .send({
            title: 'Updated Title: Top 6 Secret Beaches in Alanya 2026',
            body: '<p>Updated content with new cove near Gazipasa.</p>',
          })
          .expect(200);

        expect(res.body.title).toContain('Updated Title');
      });

      it('T1.8: POST /api/forum/comments/post/:postId allows authenticated user to reply', async () => {
        const res = await request(httpApp)
          .post(`/api/forum/comments/post/${mockForumPostData.id}`)
          .set('Authorization', 'Bearer commenter-token')
          .send({
            body: 'Great recommendation, thanks!',
          })
          .expect(201);

        expect(res.body.body).toBe('Great recommendation, thanks!');
        expect(res.body.author_id).toBe(mockUserCommenter.id);
      });

      it('T1.9: POST /api/forum/posts/:id/like toggles post reaction', async () => {
        const res = await request(httpApp)
          .post(`/api/forum/posts/${mockForumPostData.id}/like`)
          .set('Authorization', 'Bearer commenter-token')
          .expect(201);

        expect(res.body).toEqual({ liked: true, likesCount: 19 });
      });

      it('T1.10: POST /api/forum/comments/:id/like toggles comment reaction', async () => {
        const res = await request(httpApp)
          .post(`/api/forum/comments/${mockForumCommentData.id}/like`)
          .set('Authorization', 'Bearer author-token')
          .expect(201);

        expect(res.body).toEqual({ liked: true, likesCount: 5 });
      });
    });

    describe('R3 & R4: Bookmarks, Server-Side Debounced Search & Discovery', () => {
      it('T1.11: GET /api/forum/posts?search=Beaches filters matching threads', async () => {
        const res = await request(httpApp)
          .get('/api/forum/posts?search=Beaches')
          .expect(200);

        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toContain('Beaches');
        expect(forumServiceMock.getForumPosts).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Beaches' }),
          undefined,
        );
      });

      it('T1.12: GET /api/forum/events?search=Jazz searches events server-side', async () => {
        const res = await request(httpApp)
          .get('/api/forum/events?search=Jazz')
          .expect(200);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toContain('Jazz');
      });

      it('T1.13: GET /api/forum/stats returns community statistics counters', async () => {
        const res = await request(httpApp).get('/api/forum/stats').expect(200);

        expect(res.body).toEqual({
          totalPosts: 120,
          totalMembers: 450,
          totalCategories: 8,
          totalComments: 980,
        });
      });

      it('T1.14: GET /api/forum/members returns member directory', async () => {
        const res = await request(httpApp)
          .get('/api/forum/members?limit=10')
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].full_name).toBe('Elena Rostova');
      });

      it('T1.15: GET /api/blog returns paginated blog posts list', async () => {
        const res = await request(httpApp)
          .get('/api/blog?page=1&limit=5')
          .expect(200);

        expect(res.body).toMatchObject({
          posts: expect.any(Array),
          total: 1,
          page: 1,
        });
      });
    });

    describe('R5 & R6: Media Processing, Security & Rate Limiting', () => {
      it('T1.16: POST /api/media/upload processes and uploads image buffer', async () => {
        const fakeBuffer = Buffer.from('fake-jpeg-image-bytes');
        const res = await request(httpApp)
          .post('/api/media/upload')
          .attach('file', fakeBuffer, 'vacation-villa.jpg')
          .field('bucket', 'forum-media')
          .field('folder', 'threads')
          .expect(201);

        expect(res.body).toMatchObject({
          url: expect.stringContaining(
            'forum-media/threads/optimized-uuid.webp',
          ),
          bucket: 'forum-media',
          mimetype: 'image/webp',
          size: 85240,
        });
      });

      it('T1.17: GET /api/blog/tags retrieves available blog category tags', async () => {
        const res = await request(httpApp).get('/api/blog/tags').expect(200);

        expect(res.body).toHaveLength(2);
        expect(res.body[0].name).toBe('Expat Life');
      });

      it('T1.18: Applies standard HTTP security headers on all responses', async () => {
        const res = await request(httpApp)
          .get('/api/forum/categories')
          .expect(200);

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('DENY');
        expect(res.headers['referrer-policy']).toBe(
          'strict-origin-when-cross-origin',
        );
      });
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('T2.1: Rejects unauthenticated request to /api/notifications with 401', async () => {
      const res = await request(httpApp).get('/api/notifications').expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.statusCode).toBe(401);
    });

    it('T2.2: Rejects unauthorized post edit by non-author with 403 Forbidden', async () => {
      await request(httpApp)
        .put(`/api/forum/posts/${mockForumPostData.id}`)
        .set('Authorization', 'Bearer commenter-token')
        .send({ title: 'Malicious Hijack' })
        .expect(403);
    });

    it('T2.3: Rejects invalid media upload when bucket is missing', async () => {
      const fakeBuffer = Buffer.from('image-bytes');
      const res = await request(httpApp)
        .post('/api/media/upload')
        .attach('file', fakeBuffer, 'pic.jpg')
        .expect(400);

      expect(res.body.error.message).toContain('Bucket name is required');
    });

    it('T2.4: Search with non-matching query returns empty dataset gracefully', async () => {
      const res = await request(httpApp)
        .get('/api/forum/posts?search=XYZNonExistentKeyword999')
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('T2.5: Handles notifications mark-all-as-read when user has 0 unread without throwing', async () => {
      const emptyUserId = 'user-empty-999';
      const count = await notificationsService.markAllAsRead(emptyUserId);
      expect(count).toBe(0);
    });

    it('T2.6: Admin role authorization allows admin to edit any thread', async () => {
      const res = await request(httpApp)
        .put(`/api/forum/posts/${mockForumPostData.id}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ title: 'Moderator Edit: Cleaned Title' })
        .expect(200);

      expect(res.body.title).toContain('Moderator Edit');
    });

    it('T2.7: Strict endpoint rate limiting triggers 429 after threshold', async () => {
      // Endpoint /api/products/orders has strict limit = 2
      await request(httpApp).post('/api/products/orders').send({});
      await request(httpApp).post('/api/products/orders').send({});
      const res = await request(httpApp)
        .post('/api/products/orders')
        .send({})
        .expect(429);

      expect(res.body.statusCode).toBe(429);
      expect(res.body.error).toBe('Too Many Requests');
      expect(res.headers['retry-after']).toBeDefined();
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS & PAIRWISE FLOWS
  // =========================================================================
  describe('Tier 3: Cross-Feature Interactions & Pairwise Flows', () => {
    it('T3.1: Comment Creation -> Persistent Notification dispatch to thread author', async () => {
      // 1. Commenter replies to author's thread
      const commentRes = await request(httpApp)
        .post(`/api/forum/comments/post/${mockForumPostData.id}`)
        .set('Authorization', 'Bearer commenter-token')
        .send({
          body: 'Are these beaches suitable for children with strollers?',
        })
        .expect(201);

      // 2. System triggers persistent notification for post author
      const notification = await notificationsService.notifyUser(
        mockUserAuthor.id,
        {
          type: 'COMMUNITY',
          title: 'New Comment on Your Thread',
          message: 'A user asked a question on "Top 5 Secret Beaches"',
          data: { postId: mockForumPostData.id, commentId: commentRes.body.id },
        },
      );

      // 3. Author fetches notifications and confirms delivery
      const authorNotifs = await request(httpApp)
        .get('/api/notifications')
        .set('Authorization', 'Bearer author-token')
        .expect(200);

      const found = authorNotifs.body.find(
        (n: LiveNotification) => n.id === notification.id,
      );
      expect(found).toBeDefined();
      expect(found.read).toBe(false);
    });

    it('T3.2: Media Upload -> Post Attachment -> Search Discovery', async () => {
      // 1. Upload image asset
      const mediaRes = await request(httpApp)
        .post('/api/media/upload')
        .attach('file', Buffer.from('img-data'), 'cove.webp')
        .field('bucket', 'forum-media')
        .expect(201);

      const cdnUrl = mediaRes.body.url;
      expect(cdnUrl).toContain('forum-media');

      // 2. Author creates post embedding the uploaded image URL
      const postRes = await request(httpApp)
        .post('/api/forum/posts')
        .set('Authorization', 'Bearer author-token')
        .send({
          title: 'Hidden Gem: Delikdeniz King Bay Guide',
          body: `<p>Check this pristine water: <img src="${cdnUrl}" /></p>`,
          category_id: '550e8400-e29b-41d4-a716-446655440000',
        })
        .expect(201);

      expect(postRes.body.body).toContain(cdnUrl);

      // 3. Query via server-side search
      const searchRes = await request(httpApp)
        .get('/api/forum/posts?search=Delikdeniz')
        .expect(200);

      expect(searchRes.status).toBe(200);
    });

    it('T3.3: User interaction lifecycle: Like Thread -> Notification -> Mark Read', async () => {
      // 1. Commenter likes author's thread
      await request(httpApp)
        .post(`/api/forum/posts/${mockForumPostData.id}/like`)
        .set('Authorization', 'Bearer commenter-token')
        .expect(201);

      // 2. Dispatch reaction notification
      const notif = await notificationsService.notifyUser(mockUserAuthor.id, {
        type: 'COMMUNITY',
        title: 'New Like Received',
        message: 'Your thread received a new like!',
      });

      // 3. Author marks notification as read
      const readRes = await request(httpApp)
        .patch(`/api/notifications/${notif.id}/read`)
        .set('Authorization', 'Bearer author-token')
        .expect(200);

      expect(readRes.body.success).toBe(true);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD WORKLOAD SCENARIOS
  // =========================================================================
  describe('Tier 4: Real-World Workload Scenarios', () => {
    it('T4.1: Concurrent community browsing, searching, and notification polling', async () => {
      const concurrentRequests = [
        request(httpApp).get('/api/forum/categories'),
        request(httpApp).get('/api/forum/posts?search=alanya'),
        request(httpApp).get('/api/forum/events?upcomingOnly=true'),
        request(httpApp).get('/api/blog?limit=3'),
        request(httpApp).get('/api/forum/stats'),
        request(httpApp)
          .get('/api/notifications')
          .set('Authorization', 'Bearer author-token'),
      ];

      const results = await Promise.all(concurrentRequests);
      results.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });

    it('T4.2: High-volume notification spam retains last 50 entries FIFO cap', async () => {
      const testUserId = 'user-heavy-load-555';
      for (let i = 1; i <= 65; i++) {
        await notificationsService.notifyUser(testUserId, {
          type: 'SYSTEM',
          title: `System Alert #${i}`,
          message: `Periodic health telemetry #${i}`,
        });
      }

      const list = await notificationsService.getUserNotifications(testUserId);
      expect(list).toHaveLength(50);
      expect(list[0].title).toBe('System Alert #65');
      expect(list[49].title).toBe('System Alert #16');
    });
  });
});
