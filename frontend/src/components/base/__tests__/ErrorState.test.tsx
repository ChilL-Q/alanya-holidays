import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders default title and message in card variant', () => {
    render(<ErrorState />);
    expect(screen.getByText('Unable to load content')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred. Please check your connection and try again.'),
    ).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<ErrorState title="Failed to load items" message="Server error 500" />);
    expect(screen.getByText('Failed to load items')).toBeInTheDocument();
    expect(screen.getByText('Server error 500')).toBeInTheDocument();
  });

  it('renders retry button and triggers onRetry callback when clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);

    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders inline variant with compact layout', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        variant="inline"
        message="Failed to update comment"
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByText('Failed to update comment')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders fullscreen variant with accessible role', () => {
    render(<ErrorState variant="fullscreen" title="Critical outage" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Critical outage')).toBeInTheDocument();
  });
});
