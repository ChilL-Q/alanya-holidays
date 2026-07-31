import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('CreateBookingDto validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const meta = { type: 'body' as const, metatype: CreateBookingDto };

  const valid = {
    item_id: '11111111-1111-4111-8111-111111111111',
    user_id: '22222222-2222-4222-8222-222222222222',
    check_in: '2026-08-01',
    check_out: '2026-08-05',
    total_price: 100,
    guests: 2,
  };

  it('rejects a non-UUID item_id with 400', async () => {
    await expect(
      pipe.transform({ ...valid, item_id: 'not-a-uuid' }, meta),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a missing required field (check_in) with 400', async () => {
    const { check_in, ...missing } = valid;
    await expect(pipe.transform(missing, meta)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('accepts a valid body and strips unknown fields', async () => {
    const out = await pipe.transform({ ...valid, hackerField: 'x' }, meta);
    expect(out).toBeInstanceOf(CreateBookingDto);
    expect((out as Record<string, unknown>).hackerField).toBeUndefined();
  });
});
