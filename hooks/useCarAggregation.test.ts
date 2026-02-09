import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCarAggregation } from './useCarAggregation';
import { ServiceData } from '../api-services';

describe('useCarAggregation', () => {
  it('returns empty array for empty input', () => {
    const { result } = renderHook(() => useCarAggregation([]));
    expect(result.current).toEqual([]);
  });

  it('aggregates cars by brand and model', () => {
    const mockServices = [
      {
        id: '1',
        title: 'Toyota Corolla',
        price: 50,
        images: ['img1.jpg'],
        features: { brand: 'Toyota', model: 'Corolla', year: '2022', transmission: 'Auto', fuel: 'Gas' }
      },
      {
        id: '2',
        title: 'Toyota Corolla Basic',
        price: 40, // Cheaper
        images: ['img2.jpg'],
        features: { brand: 'Toyota', model: 'Corolla', year: '2021', transmission: 'Manual', fuel: 'Gas' }
      },
      {
        id: '3',
        title: 'Honda Civic',
        price: 60,
        images: ['img3.jpg'],
        features: { brand: 'Honda', model: 'Civic', year: '2023', transmission: 'Auto', fuel: 'Hybrid' }
      }
    ] as unknown as ServiceData[];

    const { result } = renderHook(() => useCarAggregation(mockServices));
    const groups = result.current;

    expect(groups).toHaveLength(2);

    // Toyota Group
    const toyota = groups.find(g => g.brand === 'Toyota');
    expect(toyota).toBeDefined();
    expect(toyota?.count).toBe(2);
    expect(toyota?.minPrice).toBe(40); // Should pick lower price
    expect(toyota?.id).toBe('toyota-corolla');

    // Honda Group
    const honda = groups.find(g => g.brand === 'Honda');
    expect(honda).toBeDefined();
    expect(honda?.count).toBe(1);
    expect(honda?.minPrice).toBe(60);
  });
});
