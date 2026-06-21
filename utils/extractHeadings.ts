import { slugify } from './slugify';

export interface HeadingItem {
    id: string;
    text: string;
    level: 'h2' | 'h3';
}

/**
 * Extracts headings from HTML, assigns unique slugified IDs, and returns modified HTML with IDs.
 */
export function extractHeadingsFromHTML(html: string): {
    processedContent: string;
    headings: HeadingItem[];
} {
    if (typeof window === 'undefined') {
        return { processedContent: html, headings: [] };
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const headingElements = doc.querySelectorAll('h2, h3');

        const headingIds = new Set<string>();
        const extractedHeadings: HeadingItem[] = [];

        headingElements.forEach((el, index) => {
            const text = el.textContent || '';
            const baseSlug = slugify(text) || `heading-${index + 1}`;

            let uniqueId = baseSlug;
            let counter = 1;
            while (headingIds.has(uniqueId)) {
                uniqueId = `${baseSlug}-${counter}`;
                counter++;
            }

            headingIds.add(uniqueId);
            el.setAttribute('id', uniqueId);

            extractedHeadings.push({
                id: uniqueId,
                text,
                level: el.tagName.toLowerCase() as 'h2' | 'h3',
            });
        });

        return {
            processedContent: doc.body.innerHTML,
            headings: extractedHeadings,
        };
    } catch (err) {
        console.error('Failed to parse headings:', err);
        return { processedContent: html, headings: [] };
    }
}
