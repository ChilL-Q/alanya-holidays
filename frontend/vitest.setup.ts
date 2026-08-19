import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import React from 'react';

// react-helmet-async requires HelmetProvider in the tree.
// In tests we just render children as-is.
vi.mock('react-helmet-async', () => ({
  HelmetProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  Helmet: () => null,
}));

// Suppress expected console noise (error-path tests, act() warnings, etc.)
// Tests that need to assert on console.error can still use expect(console.error).toHaveBeenCalled()
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
