import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { initSentry, Sentry } from './utils/sentry';
import { queryClient } from './lib/queryClient';
import './index.css';

// Initialize Sentry error tracking (no-op if VITE_SENTRY_DSN is not set)
initSentry();

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[index.tsx] FATAL: Could not find root element to mount to');
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

// Global fix to prevent mouse wheel from changing numerical input values
function setupWheelGuard() {
  const handler = (_e: WheelEvent) => {
    if (document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type === 'number') {
      (document.activeElement as HTMLElement).blur();
    }
  };
  document.addEventListener('wheel', handler, { passive: false });
  return () => document.removeEventListener('wheel', handler);
}

const cleanup = setupWheelGuard();
if (import.meta.hot) {
  import.meta.hot.dispose(cleanup);
}

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Sentry.ErrorBoundary>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);

/** Minimal fallback shown only when Sentry's own boundary catches
 *  something our custom ErrorBoundary missed (e.g. render-time errors
 *  inside ErrorBoundary itself). */
function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          The error has been reported. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}