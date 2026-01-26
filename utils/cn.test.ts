import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('bg-red-500', 'text-white');
    expect(result).toBe('bg-red-500 text-white');
  });

  it('handles conditional classes', () => {
    const result = cn('base-class', true && 'active', false && 'inactive');
    expect(result).toBe('base-class active');
  });

  it('merges tailwind classes using tailwind-merge', () => {
    // p-4 should overwrite p-2
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('handles undefined and null inputs', () => {
    const result = cn('base', undefined, null, 'extra');
    expect(result).toBe('base extra');
  });
});
