import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || dsn.trim() === '') {
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      release: import.meta.env.VITE_APP_VERSION || '0.0.1',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (error) {
    console.warn(
      'Failed to initialize Sentry on frontend:',
      error instanceof Error ? error.message : String(error),
    );
  }
}
