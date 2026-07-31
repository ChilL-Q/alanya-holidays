import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { prefetchPropertyQuery } from '../../api-services/api/properties';

describe('prefetchPropertyQuery', () => {
  it('should prefetch property details into QueryClient cache', async () => {
    const queryClient = new QueryClient();
    const fetchSpy = vi.spyOn(queryClient, 'prefetchQuery');
    
    await prefetchPropertyQuery(queryClient, 'prop-123');
    
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['property', 'prop-123'],
      })
    );
  });
});
