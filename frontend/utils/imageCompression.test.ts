import { describe, it, expect } from 'vitest';
import { compressImage } from './imageCompression';

describe('compressImage', () => {
    it('returns original file for SVG files', async () => {
        const svgFile = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
        const result = await compressImage(svgFile);
        expect(result).toBe(svgFile);
    });

    it('returns original file if size is under 200KB', async () => {
        const smallFile = new File([new ArrayBuffer(100 * 1024)], 'small.jpg', { type: 'image/jpeg' });
        const result = await compressImage(smallFile);
        expect(result).toBe(smallFile);
    });
});
