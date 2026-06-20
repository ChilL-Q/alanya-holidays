import { describe, it, expect } from 'vitest';
import { formatBlogContent } from './formatBlogContent';

describe('formatBlogContent', () => {
    it('converts double newlines into separate <p> tags', () => {
        const result = formatBlogContent('First paragraph\n\nSecond paragraph', []);
        expect(result).toBe('<p>First paragraph</p>\n<p>Second paragraph</p>');
    });

    it('converts single newlines within a paragraph to <br>', () => {
        const result = formatBlogContent('Line one\nLine two', []);
        expect(result).toBe('<p>Line one<br>Line two</p>');
    });

    it('converts ## heading to <h2>', () => {
        const result = formatBlogContent('## Heading\n\nBody text', []);
        expect(result).toContain('<h2>Heading</h2>');
        expect(result).toContain('<p>Body text</p>');
    });

    it('converts ### heading to <h3>', () => {
        const result = formatBlogContent('### Subheading', []);
        expect(result).toBe('<h3>Subheading</h3>');
    });

    it('converts consecutive list items into a single <ul>', () => {
        const result = formatBlogContent('- one\n- two\n- three', []);
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>one</li>');
        expect(result).toContain('<li>two</li>');
        expect(result).toContain('<li>three</li>');
    });

    it('converts **bold** markdown to <strong>', () => {
        const result = formatBlogContent('This is **bold** text', []);
        expect(result).toBe('<p>This is <strong>bold</strong> text</p>');
    });

    it('converts > quote to <blockquote>', () => {
        const result = formatBlogContent('> Important quote', []);
        expect(result).toContain('<blockquote>');
        expect(result).toContain('Important quote');
    });

    it('replaces image placeholders inside markdown-generated blocks', () => {
        const result = formatBlogContent('## Gallery\n\n[image-1]', ['https://example.com/img1.jpg']);
        expect(result).toContain('<h2>Gallery</h2>');
        expect(result).toContain('<img src="https://example.com/img1.jpg" alt="Blog Image 1"');
        expect(result).not.toContain('[image-1]');
    });

    it('replaces [image-1] placeholder with img tag containing the URL', () => {
        const result = formatBlogContent('Text with [image-1] in it', ['https://example.com/img1.jpg']);
        expect(result).toContain('<img src="https://example.com/img1.jpg" alt="Blog Image 1"');
        expect(result).not.toContain('[image-1]');
    });

    it('appends extra images (index > 0) with no matching placeholder at the end', () => {
        const result = formatBlogContent('Some text', ['cover.jpg', 'extra.jpg']);
        expect(result).toContain('<p>Some text</p>');
        expect(result).toContain('<img src="extra.jpg" alt="Blog Image 2"');
    });

    it('does not auto-append the cover image (index 0) even if unused', () => {
        const result = formatBlogContent('Some text', ['cover.jpg']);
        expect(result).toBe('<p>Some text</p>');
        expect(result).not.toContain('cover.jpg');
    });

    it('returns empty string for empty input with no images', () => {
        const result = formatBlogContent('', []);
        expect(result).toBe('');
    });

    it('wraps a plain single paragraph in <p> tags', () => {
        const result = formatBlogContent('Just one paragraph', []);
        expect(result).toBe('<p>Just one paragraph</p>');
    });

    it('handles multiple images with placeholders', () => {
        const result = formatBlogContent('Text [image-1] and [image-2] here', [
            'img1.jpg',
            'img2.jpg',
        ]);
        expect(result).toContain('<img src="img1.jpg" alt="Blog Image 1"');
        expect(result).toContain('<img src="img2.jpg" alt="Blog Image 2"');
        expect(result).not.toContain('[image-1]');
        expect(result).not.toContain('[image-2]');
    });

    it('handles mixed placeholders and unmatched images', () => {
        const result = formatBlogContent('Image here: [image-1]', [
            'cover.jpg',
            'matched.jpg',
            'unmatched.jpg',
        ]);
        expect(result).toContain('<img src="cover.jpg"');
        expect(result).toContain('<img src="matched.jpg"');
        expect(result).toContain('<img src="unmatched.jpg"');
    });

    it('trims whitespace from paragraphs', () => {
        const result = formatBlogContent('  Paragraph with spaces  ', []);
        expect(result).toBe('<p>Paragraph with spaces</p>');
    });
});
