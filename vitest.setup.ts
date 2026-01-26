import '@testing-library/jest-dom';

// Cleanup after each test case (e.g. clearing jsdom)
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
