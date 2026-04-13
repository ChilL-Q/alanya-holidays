/**
 * Parses a YouTube or Vimeo URL and returns an embeddable URL.
 *
 * Supports:
 * - YouTube: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
 * - Vimeo: vimeo.com/..., player.vimeo.com/video/...
 *
 * Returns null if the URL is not a valid YouTube or Vimeo URL.
 */
export function parseVideoEmbed(url: string): { embedUrl: string; provider: 'youtube' | 'vimeo'; videoId: string } | null {
    if (!url) return null;

    const trimmed = url.trim();

    // YouTube patterns
    const youtubePatterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
        /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of youtubePatterns) {
        const match = trimmed.match(pattern);
        if (match) {
            const videoId = match[1];
            return {
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
                provider: 'youtube',
                videoId,
            };
        }
    }

    // Vimeo patterns
    const vimeoPatterns = [
        /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
        /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
    ];

    for (const pattern of vimeoPatterns) {
        const match = trimmed.match(pattern);
        if (match) {
            const videoId = match[1];
            return {
                embedUrl: `https://player.vimeo.com/video/${videoId}`,
                provider: 'vimeo',
                videoId,
            };
        }
    }

    return null;
}

/**
 * Validates that a URL is a valid YouTube or Vimeo URL.
 */
export function isValidVideoUrl(url: string): boolean {
    return parseVideoEmbed(url) !== null;
}
