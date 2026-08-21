import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Sentry from '@sentry/react';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));

const ThrowErrorComponent: React.FC<{ shouldThrow?: boolean; message?: string }> = ({
  shouldThrow = true,
  message = 'Test explosion',
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="child-content">Child Content Loaded Successfully</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('child-content')).toHaveTextContent(
      'Child Content Loaded Successfully',
    );
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('renders default fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} message="Render failure" />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('renders custom fallback ReactNode when fallback prop is provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Fallback Message</div>}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Custom Fallback Message');
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('renders custom fallback render function with reset callback', () => {
    render(
      <ErrorBoundary
        fallback={({ error, resetErrorBoundary }) => (
          <div>
            <span>Error: {error.message}</span>
            <button onClick={resetErrorBoundary}>Retry Now</button>
          </div>
        )}
      >
        <ThrowErrorComponent shouldThrow={true} message="Custom render function error" />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Error: Custom render function error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Now/i })).toBeInTheDocument();
  });

  it('resets error boundary state when Try Again button is clicked', () => {
    const ResettableContainer = () => {
      const [hasError, setHasError] = useState(true);
      return (
        <ErrorBoundary onReset={() => setHasError(false)}>
          <ThrowErrorComponent shouldThrow={hasError} />
        </ErrorBoundary>
      );
    };

    render(<ResettableContainer />);

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(tryAgainButton);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('calls custom onError handler when error is caught', () => {
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowErrorComponent shouldThrow={true} message="Handler error" />
      </ErrorBoundary>,
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock.mock.calls[0][0].message).toBe('Handler error');
  });
});
