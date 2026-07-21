import { describe, it, expect } from 'vitest';
import { parseVideoEmbed, isValidVideoUrl } from './videoEmbed';

describe('parseVideoEmbed', () => {
    describe('YouTube URLs', () => {
        it('parses standard youtube.com/watch?v= URL', () => {
            const result = parseVideoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                provider: 'youtube',
                videoId: 'dQw4w9WgXcQ',
            });
        });

        it('parses short youtu.be/ URL', () => {
            const result = parseVideoEmbed('https://youtu.be/dQw4w9WgXcQ');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                provider: 'youtube',
                videoId: 'dQw4w9WgXcQ',
            });
        });

        it('parses /embed/ URL', () => {
            const result = parseVideoEmbed('https://www.youtube.com/embed/dQw4w9WgXcQ');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                provider: 'youtube',
                videoId: 'dQw4w9WgXcQ',
            });
        });

        it('parses /v/ URL', () => {
            const result = parseVideoEmbed('https://www.youtube.com/v/dQw4w9WgXcQ');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                provider: 'youtube',
                videoId: 'dQw4w9WgXcQ',
            });
        });

        it('parses /shorts/ URL', () => {
            const result = parseVideoEmbed('https://www.youtube.com/shorts/abc123xyz');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/abc123xyz',
                provider: 'youtube',
                videoId: 'abc123xyz',
            });
        });

        it('parses URL without protocol', () => {
            const result = parseVideoEmbed('youtube.com/watch?v=abc123');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/abc123',
                provider: 'youtube',
                videoId: 'abc123',
            });
        });

        it('parses URL without www', () => {
            const result = parseVideoEmbed('https://youtube.com/watch?v=abc123');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/abc123',
                provider: 'youtube',
                videoId: 'abc123',
            });
        });

        it('parses video IDs with hyphens and underscores', () => {
            const result = parseVideoEmbed('https://youtu.be/aB_123-cD');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/aB_123-cD',
                provider: 'youtube',
                videoId: 'aB_123-cD',
            });
        });
    });

    describe('Vimeo URLs', () => {
        it('parses standard vimeo.com/ URL', () => {
            const result = parseVideoEmbed('https://vimeo.com/123456789');
            expect(result).toEqual({
                embedUrl: 'https://player.vimeo.com/video/123456789',
                provider: 'vimeo',
                videoId: '123456789',
            });
        });

        it('parses www.vimeo.com/ URL', () => {
            const result = parseVideoEmbed('https://www.vimeo.com/987654321');
            expect(result).toEqual({
                embedUrl: 'https://player.vimeo.com/video/987654321',
                provider: 'vimeo',
                videoId: '987654321',
            });
        });

        it('parses player.vimeo.com/video/ URL', () => {
            const result = parseVideoEmbed('https://player.vimeo.com/video/555555555');
            expect(result).toEqual({
                embedUrl: 'https://player.vimeo.com/video/555555555',
                provider: 'vimeo',
                videoId: '555555555',
            });
        });

        it('parses URL without protocol', () => {
            const result = parseVideoEmbed('vimeo.com/111222333');
            expect(result).toEqual({
                embedUrl: 'https://player.vimeo.com/video/111222333',
                provider: 'vimeo',
                videoId: '111222333',
            });
        });
    });

    describe('invalid URLs', () => {
        it('returns null for empty string', () => {
            expect(parseVideoEmbed('')).toBeNull();
        });

        it('returns null for null-like input', () => {
            expect(parseVideoEmbed('')).toBeNull();
        });

        it('returns null for non-video URLs', () => {
            expect(parseVideoEmbed('https://google.com')).toBeNull();
        });

        it('returns null for dailymotion URLs', () => {
            expect(parseVideoEmbed('https://www.dailymotion.com/video/x123abc')).toBeNull();
        });

        it('returns null for random strings', () => {
            expect(parseVideoEmbed('not-a-url')).toBeNull();
        });

        it('trims whitespace before parsing', () => {
            const result = parseVideoEmbed('  https://youtu.be/abc123  ');
            expect(result).toEqual({
                embedUrl: 'https://www.youtube.com/embed/abc123',
                provider: 'youtube',
                videoId: 'abc123',
            });
        });
    });
});

describe('isValidVideoUrl', () => {
    it('returns true for valid YouTube URLs', () => {
        expect(isValidVideoUrl('https://youtube.com/watch?v=abc123')).toBe(true);
        expect(isValidVideoUrl('https://youtu.be/abc123')).toBe(true);
    });

    it('returns true for valid Vimeo URLs', () => {
        expect(isValidVideoUrl('https://vimeo.com/123456789')).toBe(true);
        expect(isValidVideoUrl('https://player.vimeo.com/video/123456789')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
        expect(isValidVideoUrl('https://google.com')).toBe(false);
        expect(isValidVideoUrl('not-a-url')).toBe(false);
        expect(isValidVideoUrl('')).toBe(false);
    });
});
