import { supabase } from '../supabase';

export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;
    public readonly path?: string;

    constructor(
        message: string,
        statusCode: number,
        code: string = 'API_ERROR',
        details?: unknown,
        path?: string,
    ) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.path = path;
    }
}

export interface ApiEnvelope<T> {
    success: boolean;
    data?: T;
    error?: {
        statusCode: number;
        code: string;
        message: string | string[];
        timestamp?: string;
        path?: string;
    };
}

async function getAuthHeader(): Promise<Record<string, string>> {
    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
    } catch {
        // Ignore errors in environments without active session
    }
    return {};
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const authHeaders = await getAuthHeader();
    const mergedOptions: RequestInit = {
        ...options,
        headers: {
            ...authHeaders,
            ...(options?.headers || {}),
        },
    };

    const res = await fetch(url, mergedOptions);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
        if (isJson) {
            const errData = await res.json().catch(() => null);
            if (errData && typeof errData === 'object') {
                const apiErr = errData.error || errData;
                const msg = Array.isArray(apiErr.message)
                    ? apiErr.message.join(', ')
                    : apiErr.message || errData.message || `API request failed with status ${res.status}`;
                
                throw new ApiError(
                    msg,
                    res.status,
                    apiErr.code || 'HTTP_ERROR',
                    apiErr.details || null,
                    apiErr.path || url,
                );
            }
        }
        throw new ApiError(
            `API request failed with status ${res.status} (${res.statusText || 'Server Error'})`,
            res.status,
            'SERVER_ERROR',
            null,
            url,
        );
    }

    if (!isJson) {
        throw new ApiError(
            `Invalid API response from ${url}: expected JSON, but received ${contentType || 'non-JSON payload'}.`,
            res.status,
            'INVALID_CONTENT_TYPE',
            null,
            url,
        );
    }

    const payload = (await res.json()) as ApiEnvelope<T> | T;

    // Handle Candidate 2 Backend Response Envelope { success: true, data: T }
    if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
        const envelope = payload as ApiEnvelope<T>;
        if (envelope.success === true) {
            return envelope.data as T;
        }
        if (envelope.error) {
            const msg = Array.isArray(envelope.error.message)
                ? envelope.error.message.join(', ')
                : envelope.error.message;
            throw new ApiError(
                msg,
                envelope.error.statusCode || res.status,
                envelope.error.code || 'API_ERROR',
                null,
                envelope.error.path || url,
            );
        }
    }

    return payload as T;
}

export const apiClient = {
    get: <T>(url: string, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'GET' }),

    post: <T>(url: string, body?: unknown, options?: RequestInit) =>
        request<T>(url, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers || {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T>(url: string, body?: unknown, options?: RequestInit) =>
        request<T>(url, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers || {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        }),

    patch: <T>(url: string, body?: unknown, options?: RequestInit) =>
        request<T>(url, {
            ...options,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(options?.headers || {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T>(url: string, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'DELETE' }),

    invokeFunction: async <T>(functionName: string, body?: unknown, options?: { headers?: Record<string, string> }): Promise<T> => {
        const { data, error } = await supabase.functions.invoke<T>(functionName, {
            body,
            headers: options?.headers,
        });

        if (error) {
            const message = error.message || `Edge function ${functionName} failed`;
            throw new ApiError(message, 500, 'EDGE_FUNCTION_ERROR', error, `/functions/v1/${functionName}`);
        }

        return data as T;
    },
};
