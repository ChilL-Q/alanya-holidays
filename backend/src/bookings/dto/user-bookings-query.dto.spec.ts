import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserBookingsQueryDto } from './user-bookings-query.dto';

describe('UserBookingsQueryDto', () => {
  it('transforms valid pagination strings', async () => {
    const dto = plainToInstance(UserBookingsQueryDto, {
      limit: '100',
      offset: '40',
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto).toEqual(expect.objectContaining({ limit: 100, offset: 40 }));
  });

  it('provides bounded defaults', async () => {
    const dto = plainToInstance(UserBookingsQueryDto, {});

    expect(await validate(dto)).toEqual([]);
    expect(dto).toEqual(expect.objectContaining({ limit: 20, offset: 0 }));
  });

  it.each([
    [{ limit: '101' }, 'limit'],
    [{ limit: '0' }, 'limit'],
    [{ offset: '-1' }, 'offset'],
    [{ offset: '2.5' }, 'offset'],
  ])('rejects invalid pagination %j', async (input, property) => {
    const dto = plainToInstance(UserBookingsQueryDto, input);

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain(property);
  });
});
