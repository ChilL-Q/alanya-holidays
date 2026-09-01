import { BadRequestException, ValidationPipe } from '@nestjs/common';
import {
  CreateProductDto,
  PublishProductDraftDto,
  SaveProductDraftDto,
  UpdateProductDto,
} from './product-write.dto';

describe('Product write DTO validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });

  const transform = <T>(value: unknown, metatype: new () => T) =>
    pipe.transform(value, { type: 'body', metatype });

  const validProduct = {
    title: 'Handmade Bowl',
    description: 'A locally made ceramic bowl.',
    price: 25,
    stock: 4,
    category: 'souvenirs',
    images: ['https://example.com/bowl.webp'],
  };

  it('accepts documented create fields and strips server-controlled fields', async () => {
    const result = await transform(
      {
        ...validProduct,
        seller_id: 'attacker',
        status: 'active',
        created_at: '2026-01-01T00:00:00.000Z',
      },
      CreateProductDto,
    );

    expect(result).toEqual(validProduct);
  });

  it.each([
    [{ ...validProduct, title: '' }],
    [{ ...validProduct, description: '' }],
    [{ ...validProduct, price: -1 }],
    [{ ...validProduct, stock: -1 }],
    [{ ...validProduct, title: 'x'.repeat(121) }],
    [{ ...validProduct, images: Array(11).fill('https://example.com/x.webp') }],
    [{ ...validProduct, images: ['not-a-url'] }],
    [{ ...validProduct, category: '../admin' }],
  ])('rejects invalid create payload %#', async (payload) => {
    await expect(transform(payload, CreateProductDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('permits a partial valid update while stripping lifecycle fields', async () => {
    const result = await transform(
      { price: 30, status: 'active', seller_id: 'attacker' },
      UpdateProductDto,
    );

    expect(result).toEqual({ price: 30 });
  });

  it('allows incomplete drafts but validates supplied values', async () => {
    await expect(
      transform({ title: 'Draft', price: -1 }, SaveProductDraftDto),
    ).rejects.toThrow(BadRequestException);

    await expect(
      transform(
        { draftId: '550e8400-e29b-41d4-a716-446655440003', title: 'Draft' },
        SaveProductDraftDto,
      ),
    ).resolves.toEqual({
      draftId: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Draft',
    });
  });

  it('requires a complete valid payload when publishing', async () => {
    await expect(transform({}, PublishProductDraftDto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      transform(validProduct, PublishProductDraftDto),
    ).resolves.toEqual(validProduct);
  });
});
