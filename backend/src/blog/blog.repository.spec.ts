import { BlogRepository } from './blog.repository';
import { SupabaseService } from '../supabase/supabase.service';

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  limit: jest.Mock;
  rpc: jest.Mock;
}

describe('BlogRepository', () => {
  let repository: BlogRepository;
  let client: MockSupabaseClient;

  beforeEach(() => {
    client = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      rpc: jest.fn(),
    };

    const supabaseService = {
      getClient: jest.fn().mockReturnValue(client),
    } as unknown as SupabaseService;

    repository = new BlogRepository(supabaseService);
  });

  it('filters posts through an inner blog_post_tags join when tag is provided', async () => {
    const tagId = '11111111-1111-4111-8111-111111111111';

    await repository.getBlogPosts({ tag: tagId }, 6, 0, 'anon');

    expect(client.select).toHaveBeenCalledWith(
      expect.stringContaining('tags:blog_post_tags!inner'),
      { count: 'exact' },
    );
    expect(client.eq).toHaveBeenCalledWith('tags.tag_id', tagId);
  });

  it('filters guides inside the current blog_posts content model', async () => {
    await repository.getBlogPosts({ content_type: 'guide' }, 20, 0, 'admin');
    expect(client.eq).toHaveBeenCalledWith('content_type', 'guide');
  });

  it('defaults public blog listings to blog content only', async () => {
    await repository.getBlogPosts({}, 20, 0, 'anon');
    expect(client.eq).toHaveBeenCalledWith('content_type', 'blog');
  });

  it('excludes guides from featured blog queries', async () => {
    await repository.getFeaturedBlogPosts(3);

    expect(client.eq).toHaveBeenCalledWith('content_type', 'blog');
  });

  it('uses the repaired RPC to preserve category-first fill-to-limit results', async () => {
    const categoryPost = {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Category match',
    };
    const recentPost = {
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Recent blog fill',
    };
    client.rpc.mockResolvedValue({
      data: [categoryPost, recentPost],
      error: null,
    });

    await expect(
      repository.getRelatedPosts(
        '11111111-1111-4111-8111-111111111111',
        'Travel',
        2,
      ),
    ).resolves.toEqual([categoryPost, recentPost]);
    expect(client.rpc).toHaveBeenCalledWith('get_related_posts', {
      p_post_id: '11111111-1111-4111-8111-111111111111',
      p_category: 'Travel',
      p_limit: 2,
    });
    expect(client.from).not.toHaveBeenCalled();
  });

  it('fills a partial category result from recent blogs when the RPC is unavailable', async () => {
    const categoryPost = {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Category match',
    };
    const recentPost = {
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Recent blog fill',
    };
    const relatedQuery = (data: unknown[]) => {
      const query = {
        select: jest.fn(),
        eq: jest.fn(),
        neq: jest.fn(),
        order: jest.fn(),
        limit: jest.fn().mockResolvedValue({ data, error: null }),
      };
      query.select.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      query.neq.mockReturnValue(query);
      query.order.mockReturnValue(query);
      return query;
    };
    const categoryQuery = relatedQuery([categoryPost]);
    const recentQuery = relatedQuery([categoryPost, recentPost]);
    client.rpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC unavailable' },
    });
    client.from
      .mockReturnValueOnce(categoryQuery)
      .mockReturnValueOnce(recentQuery);

    await expect(
      repository.getRelatedPosts(
        '11111111-1111-4111-8111-111111111111',
        'Travel',
        2,
      ),
    ).resolves.toEqual([categoryPost, recentPost]);
    expect(categoryQuery.eq).toHaveBeenCalledWith('content_type', 'blog');
    expect(recentQuery.eq).toHaveBeenCalledWith('content_type', 'blog');
    expect(categoryQuery.limit).toHaveBeenCalledWith(2);
    expect(recentQuery.limit).toHaveBeenCalledWith(3);
  });

  it('includes uncategorized legacy posts in the Guides category', async () => {
    await repository.getBlogPosts({ category: 'Guides' }, 6, 0, 'anon');

    expect(client.or).toHaveBeenCalledWith(
      'category.eq.Guides,category.is.null',
    );
    expect(client.eq).not.toHaveBeenCalledWith('category', 'Guides');
  });

  it('keeps exact matching for every other category', async () => {
    await repository.getBlogPosts({ category: 'Beaches' }, 6, 0, 'anon');

    expect(client.eq).toHaveBeenCalledWith('category', 'Beaches');
  });

  describe('bounded growing queries', () => {
    it('uses the exact requested ranges for submissions', async () => {
      await repository.getBlogSubmissions({ status: 'pending_review' }, 10, 20);
      expect(client.range).toHaveBeenLastCalledWith(20, 29);

      await repository.getUserBlogSubmissions('user-1', 7, 14);
      expect(client.range).toHaveBeenLastCalledWith(14, 20);
    });

    it('limits likes lookup to current-page blog comment IDs', async () => {
      const commentQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [{ id: 'page-comment-1' }, { id: 'page-comment-2' }],
          error: null,
        }),
      };
      const likesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [{ comment_id: 'page-comment-2' }],
          error: null,
        }),
      };
      client.from
        .mockReturnValueOnce(commentQuery)
        .mockReturnValueOnce(likesQuery);

      const comments = await repository.getBlogComments(
        'post-1',
        2,
        4,
        'user-1',
      );

      expect(commentQuery.range).toHaveBeenCalledWith(4, 5);
      expect(likesQuery.in).toHaveBeenCalledWith('comment_id', [
        'page-comment-1',
        'page-comment-2',
      ]);
      expect(comments).toEqual([
        { id: 'page-comment-1', isLiked: false },
        { id: 'page-comment-2', isLiked: true },
      ]);
    });
  });

  it('atomically restricts submission edits to reviewable statuses', async () => {
    const updateQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    client.from.mockReturnValueOnce(updateQuery);

    await expect(
      repository.updateBlogSubmission(
        'submission-1',
        { title: 'Late edit' },
        'user-1',
      ),
    ).resolves.toBeNull();

    expect(updateQuery.eq).toHaveBeenNthCalledWith(1, 'id', 'submission-1');
    expect(updateQuery.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-1');
    expect(updateQuery.in).toHaveBeenCalledWith('status', [
      'pending_review',
      'rejected',
    ]);
  });

  describe('toggleBlogCommentLike', () => {
    const commentId = 'comment-1';
    const userId = 'user-1';

    it.each([true, false])(
      'returns the exact persisted state from one atomic RPC when liked=%s',
      async (liked) => {
        client.rpc.mockResolvedValue({ data: liked, error: null });

        await expect(
          repository.toggleBlogCommentLike(commentId, userId),
        ).resolves.toBe(liked);
        expect(client.rpc).toHaveBeenCalledTimes(1);
        expect(client.rpc).toHaveBeenCalledWith('toggle_blog_comment_like', {
          p_comment_id: commentId,
          p_user_id: userId,
        });
        expect(client.from).not.toHaveBeenCalled();
      },
    );

    it('propagates an atomic RPC failure', async () => {
      client.rpc.mockResolvedValue({
        data: null,
        error: { message: 'toggle failed' },
      });

      await expect(
        repository.toggleBlogCommentLike(commentId, userId),
      ).rejects.toThrow('toggle failed');
    });

    it('rejects a missing RPC result instead of inventing state', async () => {
      client.rpc.mockResolvedValue({ data: null, error: null });

      await expect(
        repository.toggleBlogCommentLike(commentId, userId),
      ).rejects.toThrow('toggle_blog_comment_like returned no state');
    });
  });
});
