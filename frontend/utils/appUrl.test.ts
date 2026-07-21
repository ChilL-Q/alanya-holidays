import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppUrl } from './appUrl';

describe('getAppUrl', () => {
    beforeEach(() => {
        // Vitest maps VITE_* env vars to import.meta.env
        vi.stubEnv('VITE_APP_URL', 'https://alanyaholidays.com');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('should return the full URL for a given path', () => {
        expect(getAppUrl('/about')).toBe('https://alanyaholidays.com/about');
    });

    it('should handle paths without leading slash', () => {
        expect(getAppUrl('about')).toBe('https://alanyaholidays.com/about');
    });

    it('should handle base URLs with trailing slash', () => {
        vi.stubEnv('VITE_APP_URL', 'https://alanyaholidays.com/');
        expect(getAppUrl('/about')).toBe('https://alanyaholidays.com/about');
    });

    it('should fallback to window.location.origin if VITE_APP_URL is missing', () => {
        vi.stubEnv('VITE_APP_URL', '');
        vi.stubGlobal('window', {
            location: {
                origin: 'http://localhost:3000'
            }
        });
        expect(getAppUrl('/about')).toBe('http://localhost:3000/about');
    });

    it('should return the path as is if no base URL is available', () => {
        vi.stubEnv('VITE_APP_URL', '');
        // Mock window as undefined to simulate non-browser environment
        vi.stubGlobal('window', undefined);
        expect(getAppUrl('/about')).toBe('/about');
    });
});
