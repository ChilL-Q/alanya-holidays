import { BlogRepository } from './blog.repository';
import { SupabaseService } from '../supabase/supabase.service';

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
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
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
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
