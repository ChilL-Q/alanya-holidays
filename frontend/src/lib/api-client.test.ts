import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiError, isAbortError, shouldUseOfflineFallback } from './api-client';

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

  it('should allow offline fallback for network and 5xx errors only', () => {
    expect(shouldUseOfflineFallback(new Error('Offline'))).toBe(true);
    expect(
      shouldUseOfflineFallback(
        new ApiError('Server error', 500, 'Server Error', null, '/bookings')
      )
    ).toBe(true);
    expect(
      shouldUseOfflineFallback(
        new ApiError('Unauthorized', 401, 'Unauthorized', null, '/bookings')
      )
    ).toBe(false);
    expect(
      shouldUseOfflineFallback(
        new ApiError('Bad Request', 400, 'Bad Request', null, '/bookings')
      )
    ).toBe(false);
    expect(
      shouldUseOfflineFallback(
        new DOMException('Aborted', 'AbortError')
      )
    ).toBe(false);
  });

  it('should preserve and rethrow AbortError when request is aborted via AbortSignal', async () => {
    const abortError = new DOMException('The user aborted a request.', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    const controller = new AbortController();
    controller.abort();

    await expect(
      client.get('/aborted-endpoint', { signal: controller.signal })
    ).rejects.toSatisfy((err: unknown) => {
      return isAbortError(err) && (err as Error).name === 'AbortError';
    });
  });

  it('should identify abort errors with isAbortError helper', () => {
    const domAbort = new DOMException('Aborted', 'AbortError');
    const genericAbort = new Error('The operation was aborted');
    const apiAbort = new ApiError('Aborted', 0, 'AbortError', null, '/test', true);
    const standardError = new Error('Failed to fetch');

    expect(isAbortError(domAbort)).toBe(true);
    expect(isAbortError(genericAbort)).toBe(true);
    expect(isAbortError(apiAbort)).toBe(true);
    expect(isAbortError(standardError)).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
