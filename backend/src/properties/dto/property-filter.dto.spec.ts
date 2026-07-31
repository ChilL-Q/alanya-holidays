import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { PropertyFilterDto } from './property-filter.dto';

describe('PropertyFilterDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const meta = { type: 'body' as const, metatype: PropertyFilterDto };

  it('should accept and preserve all filter fields', async () => {
    const input = {
      priceRange: [100, 500],
      minGuests: 2,
      types: ['apartment', 'villa'],
      minBedrooms: 1,
      minBeds: 2,
      minBathrooms: 1,
      hasPhotos: true,
    };

    const result = await pipe.transform(input, meta);

    expect(result).toBeDefined();
    expect(result.priceRange).toEqual([100, 500]);
    expect(result.minGuests).toBe(2);
    expect(result.types).toEqual(['apartment', 'villa']);
    expect(result.minBedrooms).toBe(1);
    expect(result.minBeds).toBe(2);
    expect(result.minBathrooms).toBe(1);
    expect(result.hasPhotos).toBe(true);
  });

  it('should accept empty object', async () => {
    const input = {};

    const result = await pipe.transform(input, meta);

    expect(result).toBeDefined();
    expect(result.priceRange).toBeUndefined();
    expect(result.minGuests).toBeUndefined();
    expect(result.types).toBeUndefined();
    expect(result.minBedrooms).toBeUndefined();
    expect(result.minBeds).toBeUndefined();
    expect(result.minBathrooms).toBeUndefined();
    expect(result.hasPhotos).toBeUndefined();
  });

  it('should reject negative minGuests', async () => {
    const input = {
      minGuests: -1,
    };

    await expect(pipe.transform(input, meta)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject non-array priceRange', async () => {
    const input = {
      priceRange: '100,500',
    };

    await expect(pipe.transform(input, meta)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject non-string types array elements', async () => {
    const input = {
      types: ['apartment', 123],
    };

    await expect(pipe.transform(input, meta)).rejects.toThrow(
      BadRequestException,
    );
  });
});
