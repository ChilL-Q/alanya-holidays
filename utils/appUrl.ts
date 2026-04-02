/**
 * Utility to get the full application URL for a given path.
 * Centralizes link generation to ensure consistency across the app.
 * 
 * @param path - The path to append to the base URL (e.g., '/about' or 'about')
 * @returns The full application URL
 */
export function getAppUrl(path: string): string {
    const baseUrl = getBaseUrl();
    
    if (!baseUrl) return path;

    // Remove trailing slash from baseUrl and leading slash from path
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');

    return `${cleanBase}/${cleanPath}`;
}

/**
 * Utility to get the application's base URL from environment variables
 * with a safe fallback for browser environments.
 * 
 * @returns The base URL of the application
 */
export function getBaseUrl(): string {
    return import.meta.env.VITE_APP_URL || 
           (typeof window !== 'undefined' ? window.location.origin : '');
}
