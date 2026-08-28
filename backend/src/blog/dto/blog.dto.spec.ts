import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBlogCommentDto } from './create-blog-comment.dto';
import { CreateBlogPostDto } from './create-blog-post.dto';
import { CreateBlogSubmissionDto } from './create-blog-submission.dto';
import { GetBlogQueryDto } from './get-blog-query.dto';

const errorProperties = async (dto: object): Promise<string[]> => {
  const errors = await validate(dto);
  return errors.map((error) => error.property);
};

describe('Blog DTO validation', () => {
  describe('CreateBlogSubmissionDto', () => {
    it('accepts a valid community submission', async () => {
      const dto = plainToInstance(CreateBlogSubmissionDto, {
        title: 'Hidden beaches around Alanya',
        content: 'A practical guide with enough useful detail.',
        category: 'Beaches',
        video_url: 'https://www.youtube.com/watch?v=example',
        media_urls: ['https://cdn.example.com/cover.webp'],
        tags: ['11111111-1111-4111-8111-111111111111'],
      });

      expect(await errorProperties(dto)).toEqual([]);
    });

    it('rejects oversized text, invalid URLs, and too many media items', async () => {
      const dto = plainToInstance(CreateBlogSubmissionDto, {
        title: 'x'.repeat(151),
        content: 'short',
        video_url: 'javascript:alert(1)',
        media_urls: Array.from({ length: 11 }, (_, index) =>
          index === 0 ? 'not-a-url' : `https://cdn.example.com/${index}.webp`,
        ),
      });

      expect(await errorProperties(dto)).toEqual(
        expect.arrayContaining(['title', 'content', 'video_url', 'media_urls']),
      );
    });
  });

  describe('CreateBlogPostDto', () => {
    it('rejects invalid direct post fields', async () => {
      const dto = plainToInstance(CreateBlogPostDto, {
        title: 'x'.repeat(151),
        content: 'short',
        cover_image_url: 'not-a-url',
        video_url: 'javascript:alert(1)',
        tag_ids: Array.from(
          { length: 6 },
          () => '11111111-1111-4111-8111-111111111111',
        ),
        status: 'deleted',
      });

      expect(await errorProperties(dto)).toEqual(
        expect.arrayContaining([
          'title',
          'content',
          'cover_image_url',
          'video_url',
          'tag_ids',
          'status',
        ]),
      );
    });
  });

  describe('CreateBlogCommentDto', () => {
    it('rejects an empty comment and invalid parent UUID', async () => {
      const dto = plainToInstance(CreateBlogCommentDto, {
        body: '',
        parentId: 'not-a-uuid',
      });

      expect(await errorProperties(dto)).toEqual(
        expect.arrayContaining(['body', 'parentId']),
      );
    });
  });

  describe('GetBlogQueryDto', () => {
    it('accepts a bounded integer pagination query', async () => {
      const dto = plainToInstance(GetBlogQueryDto, {
        page: '2',
        limit: '50',
        offset: '0',
      });

      expect(await errorProperties(dto)).toEqual([]);
      expect(dto).toMatchObject({ page: 2, limit: 50, offset: 0 });
    });

    it('rejects fractional pagination and limits above 50', async () => {
      const dto = plainToInstance(GetBlogQueryDto, {
        page: '1.5',
        limit: '51',
        offset: '2.5',
      });

      expect(await errorProperties(dto)).toEqual(
        expect.arrayContaining(['page', 'limit', 'offset']),
      );
    });
  });
});
