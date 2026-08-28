import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AdminPropertiesQueryDto } from './admin-properties-query.dto';

describe('AdminPropertiesQueryDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata = {
    type: 'query' as const,
    metatype: AdminPropertiesQueryDto,
  };

  it('transforms pagination and applies stable defaults', async () => {
    await expect(pipe.transform({}, metadata)).resolves.toMatchObject({
      page: 1,
      limit: 20,
    });
    await expect(
      pipe.transform({ page: '2', limit: '100' }, metadata),
    ).resolves.toMatchObject({ page: 2, limit: 100 });
  });

  it.each([{ page: '0' }, { limit: '101' }, { limit: '1.5' }])(
    'rejects invalid pagination: %o',
    async (query) => {
      await expect(pipe.transform(query, metadata)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
});
