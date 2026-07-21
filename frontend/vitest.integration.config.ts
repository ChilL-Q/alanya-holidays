import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    setupFiles: ['./vitest.integration.setup.ts'],
    testTimeout: 30000,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});