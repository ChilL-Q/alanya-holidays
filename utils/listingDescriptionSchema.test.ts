import { describe, it, expect } from 'vitest';
import { listingDescriptionsSchema } from './listingDescriptionSchema';

describe('listingDescriptionsSchema', () => {
    it('accepts valid object', () => {
        expect(listingDescriptionsSchema.safeParse({ en: 'Hello', tr: 'Merhaba' }).success).toBe(true);
    });

    it('rejects non-string values', () => {
        expect(listingDescriptionsSchema.safeParse({ en: 123 }).success).toBe(false);
    });

    it('accepts empty object', () => {
        expect(listingDescriptionsSchema.safeParse({}).success).toBe(true);
    });

    it('ignores extra keys', () => {
        const result = listingDescriptionsSchema.safeParse({ en: 'Hello', de: 'Hallo' });
        expect(result.success).toBe(true);
        expect((result.data as any).de).toBeUndefined();
    });
});
