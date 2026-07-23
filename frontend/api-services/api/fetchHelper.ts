import { request } from '../core/apiClient';

/**
 * Safe fetch wrapper that checks response content-type before attempting to parse JSON.
 * Prevents "SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
 * when a non-existent API route or server error returns HTML.
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    return request<T>(url, options);
}

