import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AdminUsersQueryDto } from './admin-users-query.dto';

describe('AdminUsersQueryDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata = { type: 'query' as const, metatype: AdminUsersQueryDto };

  it('transforms pagination and applies stable defaults', async () => {
    await expect(pipe.transform({}, metadata)).resolves.toMatchObject({
      page: 1,
      limit: 20,
    });
    await expect(
      pipe.transform({ page: '2', limit: '100' }, metadata),
    ).resolves.toMatchObject({ page: 2, limit: 100 });
  });

  it.each([{ page: '0' }, { limit: '-1' }, { limit: '101' }])(
    'rejects invalid pagination: %o',
    async (query) => {
      await expect(pipe.transform(query, metadata)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
});
