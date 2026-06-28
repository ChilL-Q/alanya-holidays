import { marked } from 'marked';

export const MAX_BLOG_IMAGES = 5;

const BUTTON_CLASS =
    'inline-flex items-center gap-2 my-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold no-underline transition-colors';

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Allow internal paths and safe external/contact schemes; reject everything
// else (javascript:, data:, etc.). DOMPurify is a second line of defence on render.
function safeButtonUrl(raw: string): string | null {
    const url = raw.trim();
    if (url.startsWith('/')) return url;            // internal platform path
    if (/^https?:\/\//i.test(url)) return url;       // external link
    if (/^(mailto:|tel:)/i.test(url)) return url;    // contact
    return null;
}

function buttonTag(label: string, url: string): string {
    const isExternal = /^https?:\/\//i.test(url);
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(url)}" class="${BUTTON_CLASS}"${attrs}>${escapeHtml(label.trim())}</a>`;
}

export function formatBlogContent(rawText: string, imageUrls: string[]): string {
    // Replace shortcut-button placeholders BEFORE markdown parsing, so GFM
    // autolinking doesn't mangle the embedded URL. Invalid URLs degrade to
    // plain (escaped) label text rather than rendering an unsafe link.
    const withButtons = rawText.replace(
        /\[button:([^|\]]+)\|([^\]]+)\]/gi,
        (_match, label: string, url: string) => {
            const safe = safeButtonUrl(url);
            return safe ? buttonTag(label, safe) : escapeHtml(label.trim());
        },
    );

    // marked handles block-level markdown (headings, lists, bold, blockquote);
    // breaks:true keeps the existing "single \n -> <br>" authoring behavior
    let htmlContent = (marked.parse(withButtons.trim(), { gfm: true, breaks: true }) as string).trim();

    // Replace placeholders like [image-1], [image-2]
    imageUrls.forEach((url, index) => {
        const placeholderRegex = new RegExp(`\\[image-${index + 1}\\]`, 'gi');
        const imgTag = `<img src="${url}" alt="Blog Image ${index + 1}" class="rounded-xl shadow-lg my-6 max-h-[450px] w-auto mx-auto object-cover" />`;

        if (placeholderRegex.test(htmlContent)) {
            htmlContent = htmlContent.replace(placeholderRegex, imgTag);
        } else if (index > 0) {
            // Append unused images (except cover image, which is index 0 and displayed at the top) at the end
            htmlContent += `\n\n${imgTag}`;
        }
    });

    return htmlContent;
}
