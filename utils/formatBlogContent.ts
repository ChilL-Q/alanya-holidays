import { marked } from 'marked';

export const MAX_BLOG_IMAGES = 5;

export function formatBlogContent(rawText: string, imageUrls: string[]): string {
    // marked handles block-level markdown (headings, lists, bold, blockquote);
    // breaks:true keeps the existing "single \n -> <br>" authoring behavior
    let htmlContent = (marked.parse(rawText.trim(), { gfm: true, breaks: true }) as string).trim();

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
