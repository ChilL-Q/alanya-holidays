import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export function renderWithQuery(ui: ReactNode, options?: RenderOptions) {
  const qc = createTestQueryClient();
  return render(
    <QueryClientProvider client={qc}>{ui}</QueryClientProvider>,
    options
  );
}
