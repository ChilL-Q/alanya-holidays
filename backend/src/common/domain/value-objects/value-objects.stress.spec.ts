import { StayPeriod } from './stay-period.vo';
import { Money } from './money.vo';

describe('Adversarial Stress Test: StayPeriod & Money Value Objects', () => {
  describe('1. StayPeriod Adversarial Stress Tests', () => {
    it('1.1 Rejects zero-duration stays (checkIn === checkOut)', () => {
      expect(() => new StayPeriod('2026-06-01', '2026-06-01')).toThrow(
        'Invalid stay period: check-out date must be strictly after check-in date',
      );
      expect(
        () =>
          new StayPeriod(
            '2026-06-01T15:00:00.000Z',
            '2026-06-01T15:00:00.000Z',
          ),
      ).toThrow();
    });

    it('1.2 Rejects inverted stay ranges (checkOut < checkIn)', () => {
      expect(() => new StayPeriod('2026-06-10', '2026-06-01')).toThrow(
        'Invalid stay period: check-out date must be strictly after check-in date',
      );
    });

    it('1.3 Rejects non-string and invalid date strings', () => {
      expect(() => new StayPeriod('garbage-date', '2026-06-10')).toThrow(
        'Invalid stay period',
      );
      expect(() => new StayPeriod('2026-06-01', 'invalid-date')).toThrow(
        'Invalid stay period',
      );
      expect(() => new StayPeriod('' as any, '2026-06-10')).toThrow(
        'Invalid stay period',
      );
      expect(() => new StayPeriod(null as any, '2026-06-10')).toThrow(
        'Invalid stay period',
      );
      expect(() => new StayPeriod(undefined as any, '2026-06-10')).toThrow(
        'Invalid stay period',
      );
      expect(() => new StayPeriod(12345 as any, 67890 as any)).toThrow(
        'Invalid stay period',
      );
    });

    it('1.4 Accurately calculates nights across leap years, century boundaries, and DST', () => {
      // Leap year 2024 (Feb 28 to Mar 1 = 2 nights)
      const leap2024 = new StayPeriod('2024-02-28', '2024-03-01');
      expect(leap2024.getNightsCount()).toBe(2);

      // Non-leap year 2025 (Feb 28 to Mar 1 = 1 night)
      const nonLeap2025 = new StayPeriod('2025-02-28', '2025-03-01');
      expect(nonLeap2025.getNightsCount()).toBe(1);

      // Full leap year 2024 (366 nights)
      const fullLeap2024 = new StayPeriod('2024-01-01', '2025-01-01');
      expect(fullLeap2024.getNightsCount()).toBe(366);

      // Full non-leap year 2025 (365 nights)
      const fullNonLeap2025 = new StayPeriod('2025-01-01', '2026-01-01');
      expect(fullNonLeap2025.getNightsCount()).toBe(365);

      // DST transition (23-hour day and 25-hour day)
      // 23 hours in UTC milliseconds = 23 * 3600 * 1000 = 82800000 ms
      const dstShort = new StayPeriod(
        '2026-03-29T00:00:00Z',
        '2026-03-29T23:00:00Z',
      );
      expect(dstShort.getNightsCount()).toBe(1);

      // 25 hours in UTC
      const dstLong = new StayPeriod(
        '2026-10-25T00:00:00Z',
        '2026-10-26T01:00:00Z',
      );
      expect(dstLong.getNightsCount()).toBe(1);
    });

    it('1.5 Exhaustively tests 2D overlap matrix (all 8 topological relationships)', () => {
      // Base: June 10 to June 20
      const base = new StayPeriod('2026-06-10', '2026-06-20');

      // 1. Strictly before (June 1 - June 9): NO overlap
      const strictlyBefore = new StayPeriod('2026-06-01', '2026-06-09');
      expect(base.overlapsWith(strictlyBefore)).toBe(false);
      expect(strictlyBefore.overlapsWith(base)).toBe(false);

      // 2. Adjacent before (June 1 - June 10): NO overlap (check-out matches check-in)
      const adjacentBefore = new StayPeriod('2026-06-01', '2026-06-10');
      expect(base.overlapsWith(adjacentBefore)).toBe(false);
      expect(adjacentBefore.overlapsWith(base)).toBe(false);

      // 3. Overlapping start (June 5 - June 15): OVERLAP
      const overlapStart = new StayPeriod('2026-06-05', '2026-06-15');
      expect(base.overlapsWith(overlapStart)).toBe(true);
      expect(overlapStart.overlapsWith(base)).toBe(true);

      // 4. Identical range (June 10 - June 20): OVERLAP
      const identical = new StayPeriod('2026-06-10', '2026-06-20');
      expect(base.overlapsWith(identical)).toBe(true);
      expect(identical.overlapsWith(base)).toBe(true);

      // 5. Strictly inside (June 12 - June 18): OVERLAP
      const inside = new StayPeriod('2026-06-12', '2026-06-18');
      expect(base.overlapsWith(inside)).toBe(true);
      expect(inside.overlapsWith(base)).toBe(true);

      // 6. Strictly enclosing (June 01 - June 30): OVERLAP
      const enclosing = new StayPeriod('2026-06-01', '2026-06-30');
      expect(base.overlapsWith(enclosing)).toBe(true);
      expect(enclosing.overlapsWith(base)).toBe(true);

      // 7. Overlapping end (June 15 - June 25): OVERLAP
      const overlapEnd = new StayPeriod('2026-06-15', '2026-06-25');
      expect(base.overlapsWith(overlapEnd)).toBe(true);
      expect(overlapEnd.overlapsWith(base)).toBe(true);

      // 8. Adjacent after (June 20 - June 30): NO overlap
      const adjacentAfter = new StayPeriod('2026-06-20', '2026-06-30');
      expect(base.overlapsWith(adjacentAfter)).toBe(false);
      expect(adjacentAfter.overlapsWith(base)).toBe(false);

      // Null / undefined safety
      expect(base.overlapsWith(null as any)).toBe(false);
      expect(base.overlapsWith(undefined as any)).toBe(false);
    });

    it('1.6 Tests date containment invariants (inclusive start, exclusive end)', () => {
      const stay = new StayPeriod('2026-06-10', '2026-06-20');

      // Check-in date is contained
      expect(stay.containsDate('2026-06-10')).toBe(true);
      // Mid-stay is contained
      expect(stay.containsDate('2026-06-15')).toBe(true);
      // Check-out date is NOT contained (guest leaves on check-out day)
      expect(stay.containsDate('2026-06-20')).toBe(false);
      // Outside before / after
      expect(stay.containsDate('2026-06-09')).toBe(false);
      expect(stay.containsDate('2026-06-21')).toBe(false);

      // Invalid date string throws
      expect(() => stay.containsDate('not-a-date')).toThrow();
    });

    it('1.7 Tests value equality semantics', () => {
      const p1 = new StayPeriod('2026-06-10', '2026-06-20');
      const p2 = new StayPeriod(
        '2026-06-10T00:00:00.000Z',
        '2026-06-20T00:00:00.000Z',
      );
      const p3 = new StayPeriod('2026-06-10', '2026-06-21');

      expect(p1.equals(p2)).toBe(true);
      expect(p1.equals(p3)).toBe(false);
      expect(p1.equals(null as any)).toBe(false);
      expect(p1.equals(undefined as any)).toBe(false);
      expect(p1.equals({} as any)).toBe(false);
    });
  });

  describe('2. Money Value Object Adversarial Stress Tests', () => {
    it('2.1 Rejects negative, NaN, non-finite amounts and invalid currencies', () => {
      expect(() => new Money(-0.01, 'EUR')).toThrow('Invalid money amount');
      expect(() => new Money(NaN, 'EUR')).toThrow('Invalid money amount');
      expect(() => new Money(Infinity, 'EUR')).toThrow('Invalid money amount');
      expect(() => new Money(-Infinity, 'EUR')).toThrow('Invalid money amount');
      expect(() => new Money(100, 'US')).toThrow('Invalid currency code');
      expect(() => new Money(100, 'USDD')).toThrow('Invalid currency code');
      expect(() => new Money(100, '123')).toThrow('Invalid currency code');
      expect(() => new Money(100, '€')).toThrow('Invalid currency code');
      expect(() => new Money(100, '')).toThrow('Invalid currency code');

      expect(() => Money.fromCents(-1, 'EUR')).toThrow('Invalid money cents');
      expect(() => Money.fromCents(10.5, 'EUR')).toThrow('Invalid money cents');
      expect(() => Money.fromCents(NaN, 'EUR')).toThrow('Invalid money cents');
    });

    it('2.2 Eliminates IEEE-754 floating point drift across 10,000 additions', () => {
      let total = Money.zero('EUR');
      const step = Money.fromDecimal(0.01, 'EUR');

      for (let i = 0; i < 10000; i++) {
        total = total.add(step);
      }

      // Exactly 10,000 cents = 100.00 EUR (no 100.0000000000001 drift)
      expect(total.cents).toBe(10000);
      expect(total.amount).toBe(100);
      expect(total.format()).toBe('100.00 EUR');
    });

    it('2.3 Subtraction underflow protection', () => {
      const ten = Money.fromDecimal(10, 'USD');
      const tenCents = Money.fromDecimal(0.1, 'USD');

      expect(ten.subtract(tenCents).cents).toBe(990);
      expect(ten.subtract(ten).cents).toBe(0);

      // Attempting to subtract 10.01 from 10.00 throws error
      const tenAndOneCent = Money.fromDecimal(10.01, 'USD');
      expect(() => ten.subtract(tenAndOneCent)).toThrow(
        'Invalid money operation: result cannot be negative',
      );
    });

    it('2.4 Strict currency mismatch enforcement across all operations', () => {
      const eur = Money.fromDecimal(100, 'EUR');
      const usd = Money.fromDecimal(100, 'USD');

      expect(() => eur.add(usd)).toThrow(
        'Currency mismatch: cannot add USD to EUR',
      );
      expect(() => eur.subtract(usd)).toThrow(
        'Currency mismatch: cannot subtract USD from EUR',
      );
      expect(() => eur.greaterThan(usd)).toThrow(
        'Currency mismatch: cannot compare USD with EUR',
      );
      expect(() => eur.lessThan(usd)).toThrow(
        'Currency mismatch: cannot compare USD with EUR',
      );

      // equals returns false instead of throwing
      expect(eur.equals(usd)).toBe(false);
    });

    it('2.5 Allocation algorithm distributes remainders strictly without losing cents', () => {
      // 100 cents split 3 ways [1, 1, 1] -> [34, 33, 33] (sum = 100)
      const m100 = Money.fromCents(100, 'EUR');
      const split3 = m100.allocate([1, 1, 1]);
      expect(split3.map((m) => m.cents)).toEqual([34, 33, 33]);
      expect(split3.reduce((acc, m) => acc + m.cents, 0)).toBe(100);

      // 1000 cents split 7 ways [1, 1, 1, 1, 1, 1, 1]
      const m1000 = Money.fromCents(1000, 'EUR');
      const split7 = m1000.allocate([1, 1, 1, 1, 1, 1, 1]);
      expect(split7.length).toBe(7);
      expect(split7.reduce((acc, m) => acc + m.cents, 0)).toBe(1000);

      // Uneven weights [3, 7, 13] on 50.00 EUR (5000 cents)
      const m5000 = Money.fromCents(5000, 'TRY');
      const splitWeights = m5000.allocate([3, 7, 13]);
      expect(splitWeights.reduce((acc, m) => acc + m.cents, 0)).toBe(5000);

      // Zero total ratio throws
      expect(() => m100.allocate([0, 0, 0])).toThrow(
        'Total ratio must be positive',
      );
      // Empty ratio returns empty array
      expect(m100.allocate([])).toEqual([]);
    });

    it('2.6 Multi-currency conversion with direct and inverse rate lookups', () => {
      const eur = Money.fromDecimal(100, 'EUR');
      const rates = {
        EUR_USD: 1.08,
        TRY_EUR: 0.025, // Inverse lookup needed for EUR -> TRY
      };

      // Direct EUR -> USD
      const inUsd = eur.convert('USD', rates);
      expect(inUsd.cents).toBe(10800);
      expect(inUsd.currency).toBe('USD');

      // Inverse EUR -> TRY (1 / 0.025 = 40.0) -> 100 EUR = 4000 TRY
      const inTry = eur.convert('TRY', rates);
      expect(inTry.cents).toBe(400000); // 4000.00 TRY
      expect(inTry.currency).toBe('TRY');

      // Missing pair throws
      expect(() => eur.convert('GBP', rates)).toThrow(
        'Exchange rate not found',
      );

      // Same currency returns identical instance without rates
      expect(eur.convert('EUR')).toBe(eur);
    });

    it('2.7 Robust string parsing with international formatting', () => {
      expect(Money.parse('1.500,50 €').cents).toBe(150050);
      expect(Money.parse('1.500,50 €').currency).toBe('EUR');

      expect(Money.parse('$ 1,500.50').cents).toBe(150050);
      expect(Money.parse('$ 1,500.50').currency).toBe('USD');

      expect(Money.parse('₺ 250,75').cents).toBe(25075);
      expect(Money.parse('₺ 250,75').currency).toBe('TRY');

      expect(Money.parse('invalid text').cents).toBe(0);
      expect(Money.parse('').cents).toBe(0);
    });
  });
});
