import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles onClick events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders disabled state', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByText('Disabled')).toBeDisabled();
        expect(screen.getByText('Disabled')).toHaveClass('disabled:opacity-50');
    });

    it('renders loading state', () => {
        render(<Button isLoading>Loading</Button>);
        // Look for spinner by class or just check button is disabled
        expect(screen.getByRole('button')).toBeDisabled();
        // In our component, typically isLoading replaces text or adds spinner
    });

    it('renders variants correctly', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByText('Primary')).toHaveClass('bg-primary');

        rerender(<Button variant="outline">Outline</Button>);
        expect(screen.getByText('Outline')).toHaveClass('border-2');
    });
});
