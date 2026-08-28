import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetForumCommentsQueryDto } from './forum-comments.dto';

const errorProperties = async (dto: object): Promise<string[]> =>
  (await validate(dto)).map((error) => error.property);

describe('GetForumCommentsQueryDto', () => {
  it('transforms and accepts exact pagination boundaries', async () => {
    const minimum = plainToInstance(GetForumCommentsQueryDto, {
      limit: '1',
      offset: '0',
    });
    const maximum = plainToInstance(GetForumCommentsQueryDto, {
      limit: '50',
      offset: '25',
    });

    expect(await errorProperties(minimum)).toEqual([]);
    expect(minimum).toMatchObject({ limit: 1, offset: 0 });
    expect(await errorProperties(maximum)).toEqual([]);
    expect(maximum).toMatchObject({ limit: 50, offset: 25 });
  });

  it.each([
    [{ limit: '0', offset: '0' }, ['limit']],
    [{ limit: '51', offset: '0' }, ['limit']],
    [{ limit: '10', offset: '-1' }, ['offset']],
    [{ limit: '1.5', offset: '2.5' }, ['limit', 'offset']],
  ])('rejects invalid pagination %#', async (input, expected) => {
    const properties = await errorProperties(
      plainToInstance(GetForumCommentsQueryDto, input),
    );
    expect(properties.sort()).toEqual(expected.sort());
  });
});
