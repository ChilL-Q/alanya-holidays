import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiError } from './api-client';

describe('ApiClient', () => {
  let client: ApiClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    client = new ApiClient('/api');
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should construct GET request to expected URL and return JSON', async () => {
    const mockData = { id: 1, name: 'Alanya' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const result = await client.get<typeof mockData>('/destinations', {
      params: { region: 'Antalya', page: 1 },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/destinations?region=Antalya&page=1',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result).toEqual(mockData);
  });

  it('should construct POST request with JSON body', async () => {
    const postBody = { title: 'New Trip' };
    const mockResponse = { success: true, id: 10 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await client.post('/trips', postBody);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/trips',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postBody),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw ApiError with status and response message on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Resource not found' }),
    });

    await expect(client.get('/not-found')).rejects.toThrow(ApiError);
  });

  it('should handle network failures and throw ApiError', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    await expect(client.get('/network-fail')).rejects.toThrow(ApiError);
  });
});
