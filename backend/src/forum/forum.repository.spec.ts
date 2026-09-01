import { Test, TestingModule } from '@nestjs/testing';
import { ForumRepository } from './forum.repository';
import { SupabaseService } from '../supabase/supabase.service';

describe('ForumRepository', () => {
  let repository: ForumRepository;
  let mockSupabaseService: { getClient: jest.Mock };
  let mockClient: Record<string, jest.Mock>;

  const createQueryChain = (result: {
    data?: unknown;
    error?: { message: string; code?: string } | null;
    count?: number;
  }) => {
    const chain: Record<string, jest.Mock> = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: result.data ?? null,
        error: result.error ?? null,
      }),
      maybeSingle: jest.fn().mockResolvedValue({
        data: result.data ?? null,
        error: result.error ?? null,
      }),
      then: jest.fn((resolve: (val: unknown) => void) =>
        resolve({
          data: result.data ?? null,
          error: result.error ?? null,
          count: result.count ?? 0,
        }),
      ),
    };
    // Make query chain awaitable directly
    (chain as unknown as PromiseLike<unknown>).then = (resolve, reject) => {
      if (result.error && !chain.single.mock.calls.length) {
        return Promise.resolve({
          data: null,
          error: result.error,
          count: result.count ?? 0,
        }).then(resolve, reject);
      }
      return Promise.resolve({
        data: result.data ?? null,
        error: result.error ?? null,
        count: result.count ?? 0,
      }).then(resolve, reject);
    };
    return chain;
  };

  beforeEach(async () => {
    mockClient = {
      from: jest.fn(),
      rpc: jest.fn().mockResolvedValue({ error: null }),
    };

    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue(mockClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumRepository,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    repository = module.get<ForumRepository>(ForumRepository);
  });

  describe('User & Profile operations', () => {
    it('should return empty array when getProfilesByIds is passed empty list', async () => {
      const res = await repository.getProfilesByIds([]);
      expect(res).toEqual([]);
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it('should fetch profiles and throw on database error', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ id: 'u-1', full_name: 'John' }] }),
      );

      const res = await repository.getProfilesByIds(['u-1']);
      expect(res).toHaveLength(1);
      expect(res[0].full_name).toBe('John');

      mockClient.from.mockReturnValue(
        createQueryChain({ error: { message: 'db error' } }),
      );
      await expect(repository.getProfilesByIds(['u-2'])).rejects.toThrow(
        'db error',
      );
    });
  });

  describe('Category operations', () => {
    it('should get categories ordered by sort_order and throw on error', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ id: 'cat-1', name: 'General' }] }),
      );
      const res = await repository.getCategories();
      expect(res).toHaveLength(1);

      mockClient.from.mockReturnValue(
        createQueryChain({ error: { message: 'failed' } }),
      );
      await expect(repository.getCategories()).rejects.toThrow('failed');
    });

    it('should get category by slug and by id', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'c-1', slug: 'general' } }),
      );
      const resSlug = await repository.getCategoryBySlug('general');
      expect(resSlug?.id).toBe('c-1');

      const resId = await repository.getCategoryById('c-1');
      expect(resId?.slug).toBe('general');
    });

    it('should get categories by IDs and child categories', async () => {
      expect(await repository.getCategoriesByIds([])).toEqual([]);

      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ id: 'c-1' }, { id: 'c-2' }] }),
      );
      const byIds = await repository.getCategoriesByIds(['c-1', 'c-2']);
      expect(byIds).toHaveLength(2);

      const kids = await repository.getChildCategories('c-root');
      expect(kids).toHaveLength(2);
    });

    it('should insert, update, and delete categories', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'cat-new', name: 'News' } }),
      );
      const inserted = await repository.insertCategory({
        name: 'News',
        slug: 'news',
      });
      expect(inserted.id).toBe('cat-new');

      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'cat-new', name: 'News Updated' } }),
      );
      const updated = await repository.updateCategory('cat-new', {
        name: 'News Updated',
      });
      expect(updated.name).toBe('News Updated');

      mockClient.from.mockReturnValue(createQueryChain({ data: null }));
      await repository.deleteCategory('cat-new');
      expect(mockClient.from).toHaveBeenCalledWith('forum_categories');
    });

    it('should get post category counts and handle errors', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ category_id: 'cat-1' }] }),
      );
      const counts = await repository.getPostCategoryCounts();
      expect(counts).toHaveLength(1);

      mockClient.from.mockReturnValue(
        createQueryChain({ error: { message: 'count error' } }),
      );
      await expect(repository.getPostCategoryCounts()).rejects.toThrow(
        'count error',
      );
    });
  });

  describe('Post operations', () => {
    it('should get posts with various filters', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({
          data: [{ id: 'p-1', title: 'Post 1' }],
          count: 1,
        }),
      );

      const res = await repository.getPosts(
        {
          categoryIds: ['cat-1'],
          authorId: 'usr-1',
          postType: 'discussion',
          search: 'help',
          sort: 'popular',
          includeRemoved: false,
        },
        10,
        0,
        '*',
      );

      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);

      // Verify empty whitespace search is ignored
      const chain = createQueryChain({ data: [], count: 0 });
      mockClient.from.mockReturnValue(chain);
      await repository.getPosts({ search: '   ' }, 10, 0, '*');
      expect(chain.ilike).not.toHaveBeenCalled();
    });

    it('should get hot posts and handle errors gracefully', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ id: 'p-hot' }] }),
      );
      const hot = await repository.getHotPosts(5, '*');
      expect(hot).toHaveLength(1);
    });

    it('should get post by slug and post slugs', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'p-1', slug: 'my-post' } }),
      );
      const post = await repository.getPostBySlug('my-post', '*');
      expect(post?.id).toBe('p-1');

      mockClient.from.mockReturnValue(
        createQueryChain({
          data: [{ slug: 'my-post' }, { slug: 'my-post-1' }],
        }),
      );
      const slugs = await repository.getPostSlugs('my-post');
      expect(slugs).toEqual(['my-post', 'my-post-1']);
    });

    it('should insert, update, getById, delete, and set pinned / removed on posts', async () => {
      const queryChain = createQueryChain({
        data: { id: 'p-new', title: 'Post' },
      });
      mockClient.from.mockReturnValue(queryChain);
      const inserted = await repository.insertPost({
        title: 'Post',
        slug: 'post',
        content: 'My content from editor',
        author_id: 'u-1',
      });
      expect(inserted.id).toBe('p-new');
      expect(queryChain.insert).toHaveBeenCalledWith([
        {
          title: 'Post',
          slug: 'post',
          body: 'My content from editor',
          category_id: null,
          image_url: null,
          author_id: 'u-1',
          post_type: 'discussion',
        },
      ]);

      const byId = await repository.getPostById('p-new');
      expect(byId?.id).toBe('p-new');

      const updated = await repository.updatePost('p-new', {
        title: 'Updated',
      });
      expect(updated.id).toBe('p-new');

      await repository.updatePostPinned('p-new', true);
      await repository.setRemoved('forum_posts', 'p-new', true);
      await repository.deletePost('p-new');
    });

    it('should call increment_forum_post_view RPC', async () => {
      await repository.incrementPostView('p-1');
      expect(mockClient.rpc).toHaveBeenCalledWith('increment_forum_post_view', {
        p_post_id: 'p-1',
      });
    });
  });

  describe('Comment operations', () => {
    it('should get comments and insert comments', async () => {
      const commentsQuery = createQueryChain({
        data: [{ id: 'c-1', body: 'Hello' }],
      });
      mockClient.from.mockReturnValueOnce(commentsQuery);
      const comments = await repository.getComments('p-1', false, 15, 30);
      expect(comments).toHaveLength(1);
      expect(commentsQuery.order.mock.calls).toEqual([
        ['created_at', { ascending: true }],
        ['id', { ascending: true }],
      ]);
      expect(commentsQuery.range).toHaveBeenCalledWith(30, 44);

      mockClient.from.mockReturnValueOnce(
        createQueryChain({ data: { id: 'c-1', body: 'Hello' } }),
      );
      const inserted = await repository.insertComment({
        post_id: 'p-1',
        author_id: 'u-1',
        body: 'Hello',
      });
      expect(inserted.id).toBe('c-1');
    });

    it('should get comment by id, delete comment, and get removed comments', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'c-1', body: 'Comment' } }),
      );
      const comment = await repository.getCommentById('c-1');
      expect(comment?.id).toBe('c-1');

      mockClient.from.mockReturnValue(createQueryChain({ data: null }));
      await repository.deleteComment('c-1');

      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ id: 'c-rem', is_removed: true }] }),
      );
      const removed = await repository.getRemovedComments(10);
      expect(removed).toHaveLength(1);
    });
  });

  describe('Likes and RSVP operations', () => {
    it('should check, insert, delete, and batch get post likes', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { post_id: 'p-1' } }),
      );
      const check = await repository.checkPostLike('p-1', 'u-1');
      expect(check?.post_id).toBe('p-1');

      mockClient.from.mockReturnValue(createQueryChain({ data: null }));
      await repository.insertPostLike('p-1', 'u-1');
      await repository.deletePostLike('p-1', 'u-1');

      expect(await repository.getPostLikes('u-1', [])).toEqual([]);
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ post_id: 'p-1' }] }),
      );
      const batch = await repository.getPostLikes('u-1', ['p-1']);
      expect(batch).toHaveLength(1);
    });

    it('should check, insert, delete, and batch get comment likes', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { comment_id: 'c-1' } }),
      );
      const check = await repository.checkCommentLike('c-1', 'u-1');
      expect(check?.comment_id).toBe('c-1');

      mockClient.from.mockReturnValue(createQueryChain({ data: null }));
      await repository.insertCommentLike('c-1', 'u-1');
      await repository.deleteCommentLike('c-1', 'u-1');

      expect(await repository.getCommentLikes('u-1', [])).toEqual([]);
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ comment_id: 'c-1' }] }),
      );
      const batch = await repository.getCommentLikes('u-1', ['c-1']);
      expect(batch).toHaveLength(1);
    });

    it('should check, insert, delete, and batch get event RSVPs and attendees', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { event_id: 'evt-1' } }),
      );
      const check = await repository.checkEventRsvp('evt-1', 'u-1');
      expect(check?.event_id).toBe('evt-1');

      mockClient.from.mockReturnValue(createQueryChain({ data: null }));
      await repository.insertEventRsvp({ event_id: 'evt-1', user_id: 'u-1' });
      await repository.deleteEventRsvp('evt-1', 'u-1');

      expect(await repository.getEventRsvps('u-1', [])).toEqual([]);
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ event_id: 'evt-1' }] }),
      );
      const rsvps = await repository.getEventRsvps('u-1', ['evt-1']);
      expect(rsvps).toHaveLength(1);

      mockClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { user_id: 'u-1', contact_phone: null, created_at: '2026-08-20' },
          ],
        }),
      );
      const attendees = await repository.getEventRsvpAttendees('evt-1');
      expect(attendees).toHaveLength(1);
    });
  });

  describe('Events operations', () => {
    it('should get events, event by slug, and event slugs', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ id: 'e-1', title: 'Beach' }] }),
      );
      const events = await repository.getEvents(
        { upcomingOnly: true, search: 'Beach', includeUnpublished: false },
        '*',
      );
      expect(events).toHaveLength(1);

      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'e-1', slug: 'beach-meet' } }),
      );
      const event = await repository.getEventBySlug('beach-meet', '*');
      expect(event?.id).toBe('e-1');

      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ slug: 'beach-meet' }] }),
      );
      const slugs = await repository.getEventSlugs('beach-meet');
      expect(slugs).toEqual(['beach-meet']);

      // Verify whitespace search is ignored
      const chain = createQueryChain({ data: [] });
      mockClient.from.mockReturnValue(chain);
      await repository.getEvents({ search: '   ' }, '*');
      expect(chain.ilike).not.toHaveBeenCalled();
    });

    it('should insert, update, and delete events', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'e-1', title: 'Meet' } }),
      );
      const inserted = await repository.insertEvent({
        title: 'Meet',
        slug: 'meet',
        event_date: '2026-09-01',
      });
      expect(inserted.id).toBe('e-1');

      const updated = await repository.updateEvent('e-1', { title: 'Updated' });
      expect(updated?.id).toBe('e-1');

      mockClient.from.mockReturnValue(
        createQueryChain({ data: { id: 'e-1' } }),
      );
      await expect(repository.deleteEvent('e-1')).resolves.toBe(true);
    });

    it('atomically scopes merchant event mutations to an owned draft', async () => {
      const updateChain = createQueryChain({
        data: { id: 'e-1', is_published: false },
      });
      mockClient.from.mockReturnValueOnce(updateChain);

      await repository.updateEvent(
        'e-1',
        { title: 'Draft edit' },
        'merchant-1',
      );

      expect(updateChain.eq).toHaveBeenCalledWith('is_published', false);
      expect(updateChain.or).toHaveBeenCalledWith(
        'host_id.eq.merchant-1,created_by.eq.merchant-1',
      );

      const deleteChain = createQueryChain({ data: { id: 'e-1' } });
      mockClient.from.mockReturnValueOnce(deleteChain);
      await expect(repository.deleteEvent('e-1', 'merchant-1')).resolves.toBe(
        true,
      );
      expect(deleteChain.eq).toHaveBeenCalledWith('is_published', false);
      expect(deleteChain.or).toHaveBeenCalledWith(
        'host_id.eq.merchant-1,created_by.eq.merchant-1',
      );
    });

    it('scopes the merchant event list by owner without excluding published rows', async () => {
      const listChain = createQueryChain({
        data: [
          { id: 'draft-own', is_published: false },
          { id: 'published-own', is_published: true },
        ],
      });
      mockClient.from.mockReturnValueOnce(listChain);

      await repository.getEvents(
        { ownerId: 'merchant-1', includeUnpublished: true },
        '*',
      );

      expect(listChain.or).toHaveBeenCalledWith(
        'host_id.eq.merchant-1,created_by.eq.merchant-1',
      );
      expect(listChain.eq).not.toHaveBeenCalledWith('is_published', false);
    });
  });

  describe('Reports and Stats', () => {
    it('should insert report, get reports, and resolve report', async () => {
      mockClient.from.mockReturnValue(createQueryChain({ data: null }));
      await repository.insertReport({
        target_type: 'post',
        target_id: 'p-1',
        reporter_id: 'u-1',
        reason: 'Spam',
      });

      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ id: 'rep-1', resolved: false }] }),
      );
      const reports = await repository.getReports(false);
      expect(reports).toHaveLength(1);

      mockClient.from.mockReturnValue(createQueryChain({ data: null }));
      await repository.updateReportResolved('rep-1');
    });

    it('hydrates report targets and marks hard-deleted targets as missing', async () => {
      let postQuery: ReturnType<typeof createQueryChain> | undefined;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'forum_reports') {
          return createQueryChain({
            data: [
              {
                id: 'rep-live',
                target_type: 'post',
                target_id: 'post-live',
                resolved: false,
              },
              {
                id: 'rep-orphan',
                target_type: 'post',
                target_id: 'post-deleted',
                resolved: true,
              },
              {
                id: 'rep-comment',
                target_type: 'comment',
                target_id: 'comment-live',
                resolved: false,
              },
            ],
          });
        }
        if (table === 'forum_posts') {
          postQuery = createQueryChain({
            data: [
              {
                id: 'post-live',
                title: 'Still here',
                content: 'Visible moderation target',
                is_removed: false,
              },
            ],
          });
          return postQuery;
        }
        if (table === 'forum_comments') {
          return createQueryChain({
            data: [
              {
                id: 'comment-live',
                post_id: 'post-live',
                body: 'Reported reply',
                author_id: 'comment-author',
                is_removed: false,
              },
            ],
          });
        }
        return createQueryChain({ data: [] });
      });

      const reports = await repository.getReports({ includeResolved: true });

      expect(postQuery?.select).toHaveBeenCalledWith(
        'id, title, content:body, author_id, is_pinned, is_removed, created_at',
      );
      expect(reports).toEqual([
        expect.objectContaining({
          id: 'rep-live',
          target_missing: false,
          target_post: expect.objectContaining({
            id: 'post-live',
            content: 'Visible moderation target',
          }),
        }),
        expect.objectContaining({
          id: 'rep-orphan',
          target_missing: true,
          target_post: null,
        }),
        expect.objectContaining({
          id: 'rep-comment',
          target_missing: false,
          target_comment: expect.objectContaining({
            id: 'comment-live',
            user_id: 'comment-author',
          }),
        }),
      ]);
    });

    it('should calculate aggregated stats from multiple queries', async () => {
      let profileQueryCount = 0;
      mockClient.from.mockImplementation((table: string) => {
        if (table === 'forum_posts') {
          return createQueryChain({ count: 12 });
        }
        if (table === 'forum_comments') {
          return createQueryChain({ count: 48 });
        }
        if (table === 'profiles') {
          profileQueryCount += 1;
          if (profileQueryCount === 1) {
            return createQueryChain({ count: 7 });
          }
          return createQueryChain({
            count: 126,
            data: [{ full_name: 'Serena' }],
          });
        }
        return createQueryChain({});
      });

      const stats = await repository.getStats();
      expect(stats.totalTopics).toBe(12);
      expect(stats.totalReplies).toBe(48);
      expect(stats.usersOnline).toBe(7);
      expect(stats.totalMembers).toBe(126);
      expect(stats.latestMember).toBe('Serena');
    });
  });

  describe('Projections, Annotations and Generic toggleRow Helper', () => {
    it('should toggleRow to active when row does not exist', async () => {
      let callCount = 0;
      mockClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // select check returns not found (PGRST116)
          return createQueryChain({
            data: null,
            error: { message: 'Not found', code: 'PGRST116' },
          });
        }
        // insert succeeds
        return createQueryChain({ data: null, error: null });
      });

      const res = await repository.toggleRow(
        'forum_post_likes',
        'post_id',
        'p-1',
        'u-1',
      );
      expect(res).toEqual({ active: true });
    });

    it('should toggleRow to inactive when row already exists', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: { post_id: 'p-1' } }),
      );

      const res = await repository.toggleRow(
        'forum_post_likes',
        'post_id',
        'p-1',
        'u-1',
      );
      expect(res).toEqual({ active: false });
    });

    it('should handle duplicate key 23505 race condition gracefully in toggleRow', async () => {
      let callCount = 0;
      mockClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // select check returns not found
          return createQueryChain({
            data: null,
            error: { message: 'Not found', code: 'PGRST116' },
          });
        }
        // insert returns duplicate 23505
        return createQueryChain({
          error: {
            message: 'duplicate key value violates unique constraint',
            code: '23505',
          },
        });
      });

      const res = await repository.toggleRow(
        'forum_post_likes',
        'post_id',
        'p-1',
        'u-1',
      );
      expect(res).toEqual({ active: true });
    });

    it('should annotateLikes for posts and comments', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ post_id: 'p-1' }] }),
      );

      const posts = [{ id: 'p-1' }, { id: 'p-2' }];
      const annotated = await repository.annotateLikes(
        posts,
        'forum_post_likes',
        'post_id',
        'u-1',
      );
      expect(annotated).toEqual([
        { id: 'p-1', liked_by_me: true },
        { id: 'p-2', liked_by_me: false },
      ]);
    });

    it('should annotateRsvp for events', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({ data: [{ event_id: 'e-1' }] }),
      );

      const events = [{ id: 'e-1' }, { id: 'e-2' }] as any[];
      const annotated = await repository.annotateRsvp(events, 'u-1');
      expect(annotated).toEqual([
        { id: 'e-1', going_by_me: true },
        { id: 'e-2', going_by_me: false },
      ]);
    });

    it('should calculate postCountsByCategory map', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({
          data: [
            { category_id: 'c-1' },
            { category_id: 'c-1' },
            { category_id: 'c-2' },
          ],
        }),
      );

      const counts = await repository.postCountsByCategory();
      expect(counts.get('c-1')).toBe(2);
      expect(counts.get('c-2')).toBe(1);
    });

    it('should attach category parents to posts missing parent objects', async () => {
      mockClient.from.mockReturnValue(
        createQueryChain({
          data: [{ id: 'cat-parent-1', name: 'Parent Category' }],
        }),
      );

      const posts = [
        {
          id: 'p-1',
          category: {
            id: 'cat-1',
            parent_id: 'cat-parent-1',
            parent: undefined,
          },
        },
      ] as any[];

      await repository.attachCategoryParents(posts);
      expect(posts[0].category.parent).toEqual({
        id: 'cat-parent-1',
        name: 'Parent Category',
      });
    });
  });
});
