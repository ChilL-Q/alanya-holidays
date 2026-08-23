import { validateSync } from 'class-validator';
import { CheckConflictQueryDto } from './check-conflict-query.dto';

const validBase = {
  itemId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  itemType: 'property',
  checkIn: '2026-08-01',
  checkOut: '2026-08-05',
};

function validate(dto: Record<string, unknown>) {
  const instance = Object.assign(new CheckConflictQueryDto(), dto);
  return validateSync(instance);
}

describe('CheckConflictQueryDto', () => {
  it('accepts a fully valid query', () => {
    expect(validate(validBase)).toHaveLength(0);
  });

  it.each(['service', 'product', 'tour', 'rental', 'car'])(
    'accepts itemType=%s (aligned with create_booking RPC)',
    (itemType) => {
      expect(validate({ ...validBase, itemType })).toHaveLength(0);
    },
  );

  it('rejects unknown itemType', () => {
    const errors = validate({ ...validBase, itemType: 'spaceship' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects missing itemId', () => {
    const errors = validate({ ...validBase, itemId: undefined });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects empty itemId', () => {
    const errors = validate({ ...validBase, itemId: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid checkIn date', () => {
    const errors = validate({ ...validBase, checkIn: 'not-a-date' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid checkOut date', () => {
    const errors = validate({ ...validBase, checkOut: '2026-13-99' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects non-string dates', () => {
    const errors = validate({ ...validBase, checkIn: 12345 });
    expect(errors.length).toBeGreaterThan(0);
  });
});
