import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={PackageOpen}
        title="No items found"
        description="Try adjusting your filters to see more results."
      />,
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters to see more results.')).toBeInTheDocument();
  });

  it('renders button action and calls onClick', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={PackageOpen}
        title="Empty list"
        action={{
          label: 'Create Listing',
          onClick: handleClick,
        }}
      />,
    );

    const btn = screen.getByRole('button', { name: /Create Listing/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders link action with href when inside router', () => {
    render(
      <MemoryRouter>
        <EmptyState
          icon={PackageOpen}
          title="No bookings yet"
          action={{
            label: 'Explore Services',
            href: '/explore',
          }}
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /Explore Services/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/explore');
  });
});
