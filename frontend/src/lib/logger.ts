import * as Sentry from '@sentry/react';

type LogLevel = 'info' | 'warn' | 'error';

/**
 * Central frontend logger: mirrors console output and forwards to Sentry
 * so production failures surface in monitoring even without an exception
 * bubbling to the ErrorBoundary. Sentry SDK no-ops when not initialized.
 */
function report(level: LogLevel, args: unknown[]): void {
  const message = args
    .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
    .join(' ');

  const error = args.find((arg): arg is Error => arg instanceof Error);
  if (error) {
    Sentry.captureException(error, { extra: { context: message } });
    return;
  }

  Sentry.captureMessage(message, level === 'error' ? 'error' : 'warning');
}

function createLogger(level: LogLevel, consoleFn: (...data: unknown[]) => void) {
  return (...args: unknown[]): void => {
    consoleFn(...args);
    report(level, args);
  };
}

export const logger = {
  // eslint-disable-next-line no-console -- logger is the sanctioned console wrapper
  info: createLogger('info', (...data) => console.info(...data)),
  warn: createLogger('warn', (...data) => console.warn(...data)),
  error: createLogger('error', (...data) => console.error(...data)),
};
