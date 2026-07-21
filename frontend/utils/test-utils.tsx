import { ReactNode } from 'react';
import { render, RenderOptions, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient() {
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

export function renderHookWithQuery<T>(
  hook: () => T,
  options?: { wrapper?: React.ComponentType<{ children: React.ReactNode }> }
) {
  const qc = createTestQueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      {options?.wrapper ? <options.wrapper>{children}</options.wrapper> : children}
    </QueryClientProvider>
  );
  return renderHook(hook, { wrapper: Wrapper });
}
