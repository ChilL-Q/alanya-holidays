import { describe, it, expect } from 'vitest';
import { getListingDescription } from './getListingDescription';

const baseListing = {
    short_description: 'Default EN',
    descriptions: { en: 'EN desc', tr: 'TR desc', ru: 'RU desc', ar: 'AR desc' }
};

describe('getListingDescription', () => {
    it('returns language-matched description when available', () => {
        expect(getListingDescription(baseListing as any, 'tr')).toBe('TR desc');
        expect(getListingDescription(baseListing as any, 'ru')).toBe('RU desc');
    });

    it('falls back to English when language not available', () => {
        expect(getListingDescription({ ...baseListing, descriptions: { en: 'EN only' } } as any, 'tr')).toBe('EN only');
    });

    it('falls back to short_description when descriptions empty', () => {
        expect(getListingDescription({ short_description: 'Fallback', descriptions: {} } as any, 'en')).toBe('Fallback');
    });

    it('returns empty string when nothing available', () => {
        expect(getListingDescription({ short_description: '' } as any, 'en')).toBe('');
    });
});
