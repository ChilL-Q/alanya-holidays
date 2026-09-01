import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GetShopCatalogQueryDto } from './get-shop-catalog-query.dto';
import {
  ProductPaginationQueryDto,
  ProductVariantsQueryDto,
} from './product-pagination-query.dto';

describe('product pagination query DTOs', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const transform = <T>(value: unknown, metatype: new () => T) =>
    pipe.transform(value, { type: 'query', metatype });

  it.each([
    ProductPaginationQueryDto,
    ProductVariantsQueryDto,
    GetShopCatalogQueryDto,
  ])('transforms pagination strings for %p', async (metatype) => {
    const result = await transform({ page: '2', limit: '100' }, metatype);
    expect(result).toMatchObject({ page: 2, limit: 100 });
  });

  it('applies defaults when pagination is omitted', async () => {
    const result = await transform({}, ProductPaginationQueryDto);
    expect(result).toMatchObject({ page: 1, limit: 20 });
  });

  it.each([
    { page: '0', limit: '20' },
    { page: '1.5', limit: '20' },
    { page: '1', limit: '101' },
  ])('rejects invalid or excessive pagination %#', async (query) => {
    await expect(transform(query, ProductPaginationQueryDto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
