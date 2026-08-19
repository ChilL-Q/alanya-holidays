import { Money } from './money.vo';

describe('Money Value Object', () => {
  describe('Creation and Validation', () => {
    it('should create a valid Money instance with default currency EUR', () => {
      const money = new Money(100);
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('EUR');
    });

    it('should create a valid Money instance with specific valid currency', () => {
      const moneyUSD = new Money(250.5, 'USD');
      expect(moneyUSD.amount).toBe(250.5);
      expect(moneyUSD.currency).toBe('USD');

      const moneyTRY = new Money(1000, 'TRY');
      expect(moneyTRY.amount).toBe(1000);
      expect(moneyTRY.currency).toBe('TRY');
    });

    it('should allow zero amount', () => {
      const zero = new Money(0);
      expect(zero.amount).toBe(0);
      expect(zero.currency).toBe('EUR');
    });

    it('should normalize lowercase currency to uppercase', () => {
      const money = new Money(100, 'eur');
      expect(money.currency).toBe('EUR');
    });

    it('should throw an error for negative amount', () => {
      expect(() => new Money(-10)).toThrow(
        'Invalid money amount: amount must be a non-negative number',
      );
    });

    it('should throw an error for NaN or non-finite amount', () => {
      expect(() => new Money(NaN)).toThrow(
        'Invalid money amount: amount must be a non-negative number',
      );
      expect(() => new Money(Infinity)).toThrow(
        'Invalid money amount: amount must be a non-negative number',
      );
    });

    it('should throw an error for invalid currency code', () => {
      expect(() => new Money(100, '')).toThrow(
        'Invalid currency code: must be a 3-letter ISO currency code',
      );
      expect(() => new Money(100, 'US')).toThrow(
        'Invalid currency code: must be a 3-letter ISO currency code',
      );
      expect(() => new Money(100, 'EUROPE')).toThrow(
        'Invalid currency code: must be a 3-letter ISO currency code',
      );
    });
  });

  describe('equals()', () => {
    it('should return true for identical Money instances', () => {
      const a = new Money(150, 'EUR');
      const b = new Money(150, 'EUR');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const a = new Money(150, 'EUR');
      const b = new Money(200, 'EUR');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const a = new Money(150, 'EUR');
      const b = new Money(150, 'USD');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false when comparing to null or undefined', () => {
      const a = new Money(150, 'EUR');
      expect(a.equals(null as unknown as Money)).toBe(false);
      expect(a.equals(undefined as unknown as Money)).toBe(false);
    });
  });

  describe('add()', () => {
    it('should return a new Money instance with the sum of amounts', () => {
      const a = new Money(100, 'EUR');
      const b = new Money(50, 'EUR');
      const result = a.add(b);

      expect(result.amount).toBe(150);
      expect(result.currency).toBe('EUR');
      // Immutability check
      expect(a.amount).toBe(100);
      expect(b.amount).toBe(50);
    });

    it('should handle decimal addition accurately', () => {
      const a = new Money(0.1, 'EUR');
      const b = new Money(0.2, 'EUR');
      const result = a.add(b);

      expect(result.amount).toBe(0.3);
    });

    it('should throw an error when adding different currencies', () => {
      const eur = new Money(100, 'EUR');
      const usd = new Money(100, 'USD');

      expect(() => eur.add(usd)).toThrow(
        'Currency mismatch: cannot add USD to EUR',
      );
    });
  });

  describe('format()', () => {
    it('should format money to string representation with 2 decimal places and currency', () => {
      const money = new Money(150, 'EUR');
      expect(money.format()).toBe('150.00 EUR');
    });

    it('should format decimal amounts correctly', () => {
      const money = new Money(99.5, 'USD');
      expect(money.format()).toBe('99.50 USD');
    });

    it('should format zero amount correctly', () => {
      const money = new Money(0, 'TRY');
      expect(money.format()).toBe('0.00 TRY');
    });
  });
});
