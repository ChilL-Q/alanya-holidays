import { BlogRepository } from './blog.repository';
import { SupabaseService } from '../supabase/supabase.service';

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
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

  describe('toggleBlogCommentLike', () => {
    const commentId = 'comment-1';
    const userId = 'user-1';

    const mockLikeQueries = (
      existing: { comment_id: string } | null,
      mutationResult: { error: { message: string } | null },
    ) => {
      const lookupQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: existing,
          error: null,
        }),
      };
      const mutationQuery = {
        insert: jest.fn().mockResolvedValue(mutationResult),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: (
          resolve: (value: typeof mutationResult) => void,
        ): Promise<void> => Promise.resolve(mutationResult).then(resolve),
      };
      client.from
        .mockReturnValueOnce(lookupQuery)
        .mockReturnValueOnce(mutationQuery);
      return mutationQuery;
    };

    it('should insert a missing like and return true', async () => {
      const mutationQuery = mockLikeQueries(null, { error: null });

      await expect(
        repository.toggleBlogCommentLike(commentId, userId),
      ).resolves.toBe(true);
      expect(mutationQuery.insert).toHaveBeenCalledWith({
        comment_id: commentId,
        user_id: userId,
      });
    });

    it('should throw when inserting a like fails', async () => {
      mockLikeQueries(null, { error: { message: 'insert failed' } });

      await expect(
        repository.toggleBlogCommentLike(commentId, userId),
      ).rejects.toThrow('insert failed');
    });

    it('should delete an existing like and return false', async () => {
      const mutationQuery = mockLikeQueries(
        { comment_id: commentId },
        { error: null },
      );

      await expect(
        repository.toggleBlogCommentLike(commentId, userId),
      ).resolves.toBe(false);
      expect(mutationQuery.delete).toHaveBeenCalledTimes(1);
      expect(mutationQuery.eq).toHaveBeenNthCalledWith(
        1,
        'comment_id',
        commentId,
      );
      expect(mutationQuery.eq).toHaveBeenNthCalledWith(2, 'user_id', userId);
    });

    it('should throw when deleting a like fails', async () => {
      mockLikeQueries(
        { comment_id: commentId },
        { error: { message: 'delete failed' } },
      );

      await expect(
        repository.toggleBlogCommentLike(commentId, userId),
      ).rejects.toThrow('delete failed');
    });
  });
});
