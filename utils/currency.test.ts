
import { describe, it, expect } from 'vitest';
import { convertPrice, formatPrice } from './currency';

describe('Currency Utils', () => {
    describe('convertPrice', () => {
        it('should return the same amount if currencies are the same', () => {
            expect(convertPrice(100, 'EUR', 'EUR')).toBe(100);
            expect(convertPrice(50, 'USD', 'USD')).toBe(50);
        });

        it('should correctly convert EUR to USD', () => {
            // 1 EUR = 1.09 USD
            expect(convertPrice(100, 'EUR', 'USD')).toBeCloseTo(109);
        });

        it('should correctly convert EUR to TRY', () => {
            // 1 EUR = 38.5 TRY
            expect(convertPrice(10, 'EUR', 'TRY')).toBeCloseTo(385);
        });

        it('should correctly convert USD to EUR', () => {
            // 100 USD -> ? EUR -> 100 / 1.09 = 91.743...
            expect(convertPrice(109, 'USD', 'EUR')).toBeCloseTo(100);
        });

        it('should handle cross pairs (USD to TRY)', () => {
            // 100 USD -> EUR (100/1.09) -> TRY (*38.5)
            const eur = 100 / 1.09;
            const tryVal = eur * 38.5;
            expect(convertPrice(100, 'USD', 'TRY')).toBeCloseTo(tryVal);
        });
    });

    describe('formatPrice', () => {
        it('should format EUR correctly', () => {
            expect(formatPrice(100, 'EUR')).toBe('€100');
        });

        it('should format USD correctly', () => {
            expect(formatPrice(100, 'USD')).toBe('$100');
        });

        it('should format TRY correctly', () => {
            expect(formatPrice(100, 'TRY')).toBe('₺100');
        });

        it('should round decimal values', () => {
            expect(formatPrice(99.4, 'EUR')).toBe('€99');
            expect(formatPrice(99.5, 'EUR')).toBe('€100');
        });

        it('should handle large numbers with commas', () => {
            expect(formatPrice(1000, 'EUR')).toBe('€1,000');
            expect(formatPrice(1000000, 'USD')).toBe('$1,000,000');
        });
    });
});
