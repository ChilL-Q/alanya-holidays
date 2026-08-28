import { BadRequestException, ValidationPipe } from '@nestjs/common';
import {
  AdminDirectoryListingsQueryDto,
  AdminDirectoryStatusQueryDto,
  AdminPaginationQueryDto,
} from './admin-directory-query.dto';

describe('directory admin pagination query DTOs', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const transform = <T>(value: unknown, metatype: new () => T) =>
    pipe.transform(value, { type: 'query', metatype });

  it.each([
    AdminPaginationQueryDto,
    AdminDirectoryListingsQueryDto,
    AdminDirectoryStatusQueryDto,
  ])('transforms pagination strings for %p', async (metatype) => {
    const result = await transform({ page: '4', limit: '100' }, metatype);
    expect(result).toMatchObject({ page: 4, limit: 100 });
  });

  it('applies bounded defaults', async () => {
    const result = await transform({}, AdminDirectoryListingsQueryDto);
    expect(result).toMatchObject({ page: 1, limit: 20 });
  });

  it.each([
    { page: '-1', limit: '20' },
    { page: '1', limit: '0' },
    { page: '1', limit: '101' },
  ])('rejects invalid or excessive pagination %#', async (query) => {
    await expect(transform(query, AdminPaginationQueryDto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
