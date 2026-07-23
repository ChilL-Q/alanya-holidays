import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError, request } from './apiClient';

describe('apiClient', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should successfully make GET request and return payload', async () => {
        const mockData = { id: 1, name: 'Alanya Villa' };
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => mockData,
        } as Response);

        const result = await apiClient.get<typeof mockData>('/api/properties/1');
        expect(result).toEqual(mockData);
        expect(global.fetch).toHaveBeenCalledWith('/api/properties/1', expect.objectContaining({ method: 'GET' }));
    });

    it('should unwrap response envelope when success is true', async () => {
        const mockEnvelope = { success: true, data: { id: 100 } };
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => mockEnvelope,
        } as Response);

        const result = await request<{ id: number }>('/api/test');
        expect(result).toEqual({ id: 100 });
    });

    it('should throw ApiError with status and code when response is not ok', async () => {
        const errorJson = {
            error: {
                statusCode: 404,
                code: 'NOT_FOUND',
                message: 'Property not found',
                path: '/api/properties/999',
            },
        };
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => errorJson,
        } as Response);

        await expect(apiClient.get('/api/properties/999')).rejects.toThrowError(ApiError);
        await expect(apiClient.get('/api/properties/999')).rejects.toMatchObject({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: 'Property not found',
        });
    });

    it('should throw ApiError when content type is not JSON', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/html' }),
        } as Response);

        await expect(apiClient.get('/api/html-page')).rejects.toThrowError('expected JSON');
    });
});
