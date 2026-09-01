import { StayPeriod } from './stay-period.vo';

describe('StayPeriod Value Object', () => {
  describe('Creation and Validation', () => {
    it('should create a valid StayPeriod with valid ISO date strings', () => {
      const stayPeriod = new StayPeriod('2026-08-01', '2026-08-05');
      expect(stayPeriod.checkIn).toBe('2026-08-01');
      expect(stayPeriod.checkOut).toBe('2026-08-05');
    });

    it('should create a valid StayPeriod with full ISO timestamp strings', () => {
      const stayPeriod = new StayPeriod(
        '2026-08-01T14:00:00.000Z',
        '2026-08-05T10:00:00.000Z',
      );
      expect(stayPeriod.checkIn).toBe('2026-08-01T14:00:00.000Z');
      expect(stayPeriod.checkOut).toBe('2026-08-05T10:00:00.000Z');
    });

    it('should throw an error if checkIn is an invalid date string', () => {
      expect(() => new StayPeriod('invalid-date', '2026-08-05')).toThrow(
        'Invalid stay period: check-in and check-out must be valid ISO date strings',
      );
    });

    it('should throw an error if checkOut is an invalid date string', () => {
      expect(() => new StayPeriod('2026-08-01', 'not-a-date')).toThrow(
        'Invalid stay period: check-in and check-out must be valid ISO date strings',
      );
    });

    it('should throw an error if checkOut is equal to checkIn (0 nights)', () => {
      expect(() => new StayPeriod('2026-08-01', '2026-08-01')).toThrow(
        'Invalid stay period: check-out date must be strictly after check-in date',
      );
    });

    it('should throw an error if checkOut is before checkIn', () => {
      expect(() => new StayPeriod('2026-08-05', '2026-08-01')).toThrow(
        'Invalid stay period: check-out date must be strictly after check-in date',
      );
    });
  });

  describe('getNightsCount()', () => {
    it('should correctly calculate the number of nights for a 4-night stay', () => {
      const stayPeriod = new StayPeriod('2026-08-01', '2026-08-05');
      expect(stayPeriod.getNightsCount()).toBe(4);
    });

    it('should correctly calculate 1 night stay', () => {
      const stayPeriod = new StayPeriod('2026-08-01', '2026-08-02');
      expect(stayPeriod.getNightsCount()).toBe(1);
    });

    it('should correctly calculate nights across month boundaries', () => {
      const stayPeriod = new StayPeriod('2026-08-30', '2026-09-03');
      expect(stayPeriod.getNightsCount()).toBe(4);
    });
  });

  describe('overlapsWith()', () => {
    const base = new StayPeriod('2026-08-05', '2026-08-10');

    it('should return true for an identical period', () => {
      const identical = new StayPeriod('2026-08-05', '2026-08-10');
      expect(base.overlapsWith(identical)).toBe(true);
    });

    it('should return true when other period overlaps the start', () => {
      const overlapping = new StayPeriod('2026-08-03', '2026-08-07');
      expect(base.overlapsWith(overlapping)).toBe(true);
    });

    it('should return true when other period overlaps the end', () => {
      const overlapping = new StayPeriod('2026-08-08', '2026-08-12');
      expect(base.overlapsWith(overlapping)).toBe(true);
    });

    it('should return true when other period is completely inside', () => {
      const inside = new StayPeriod('2026-08-06', '2026-08-08');
      expect(base.overlapsWith(inside)).toBe(true);
    });

    it('should return true when other period completely encompasses base', () => {
      const outer = new StayPeriod('2026-08-01', '2026-08-15');
      expect(base.overlapsWith(outer)).toBe(true);
    });

    it('should return false for adjacent period before (checkout matches checkin)', () => {
      const adjacentBefore = new StayPeriod('2026-08-01', '2026-08-05');
      expect(base.overlapsWith(adjacentBefore)).toBe(false);
    });

    it('should return false for adjacent period after (checkin matches checkout)', () => {
      const adjacentAfter = new StayPeriod('2026-08-10', '2026-08-15');
      expect(base.overlapsWith(adjacentAfter)).toBe(false);
    });

    it('should return false for completely non-overlapping periods in past', () => {
      const past = new StayPeriod('2026-07-01', '2026-07-05');
      expect(base.overlapsWith(past)).toBe(false);
    });

    it('should return false for completely non-overlapping periods in future', () => {
      const future = new StayPeriod('2026-09-01', '2026-09-05');
      expect(base.overlapsWith(future)).toBe(false);
    });
  });

  describe('containsDate()', () => {
    const stayPeriod = new StayPeriod('2026-08-05', '2026-08-10');

    it('should return true for the check-in date', () => {
      expect(stayPeriod.containsDate('2026-08-05')).toBe(true);
    });

    it('should return true for intermediate dates within the stay', () => {
      expect(stayPeriod.containsDate('2026-08-07')).toBe(true);
      expect(stayPeriod.containsDate('2026-08-09')).toBe(true);
    });

    it('should return false for the check-out date (departure day)', () => {
      expect(stayPeriod.containsDate('2026-08-10')).toBe(false);
    });

    it('should return false for dates before check-in', () => {
      expect(stayPeriod.containsDate('2026-08-04')).toBe(false);
    });

    it('should return false for dates after check-out', () => {
      expect(stayPeriod.containsDate('2026-08-11')).toBe(false);
    });

    it('should throw an error if passed an invalid date string', () => {
      expect(() => stayPeriod.containsDate('invalid-date')).toThrow(
        'Invalid date string provided for containment check',
      );
    });
  });

  describe('equals()', () => {
    it('should return true for equivalent StayPeriods', () => {
      const a = new StayPeriod('2026-08-01', '2026-08-05');
      const b = new StayPeriod('2026-08-01', '2026-08-05');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different checkIn', () => {
      const a = new StayPeriod('2026-08-01', '2026-08-05');
      const b = new StayPeriod('2026-08-02', '2026-08-05');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different checkOut', () => {
      const a = new StayPeriod('2026-08-01', '2026-08-05');
      const b = new StayPeriod('2026-08-01', '2026-08-06');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      const a = new StayPeriod('2026-08-01', '2026-08-05');
      expect(a.equals(null as unknown as StayPeriod)).toBe(false);
      expect(a.equals(undefined as unknown as StayPeriod)).toBe(false);
    });
  });

  describe('toISOStrings()', () => {
    it('should return an object with checkIn and checkOut strings', () => {
      const stayPeriod = new StayPeriod('2026-08-01', '2026-08-05');
      expect(stayPeriod.toISOStrings()).toEqual({
        checkIn: '2026-08-01',
        checkOut: '2026-08-05',
      });
    });
  });
});
