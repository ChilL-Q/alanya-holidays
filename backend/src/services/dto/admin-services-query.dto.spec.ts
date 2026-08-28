import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AdminServicesQueryDto } from './admin-services-query.dto';

describe('AdminServicesQueryDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata = { type: 'query' as const, metatype: AdminServicesQueryDto };

  it('transforms pagination and applies stable defaults', async () => {
    await expect(pipe.transform({}, metadata)).resolves.toMatchObject({
      page: 1,
      limit: 50,
    });
    await expect(
      pipe.transform({ page: '3', limit: '100' }, metadata),
    ).resolves.toMatchObject({ page: 3, limit: 100 });
  });

  it.each([{ page: '-1' }, { limit: '0' }, { limit: '101' }])(
    'rejects invalid pagination: %o',
    async (query) => {
      await expect(pipe.transform(query, metadata)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
});
