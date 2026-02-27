import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceCard } from './ServiceCard';
import { BrowserRouter } from 'react-router-dom';
import { Car } from 'lucide-react';

// Mock dependencies
vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (p: number) => `€${p}`,
        convertPrice: (p: number) => p
    })
}));

describe('ServiceCard', () => {
    const defaultProps = {
        title: 'Test Service',
        description: 'Description',
        icon: Car,
        rawPrice: 100,
        baseCurrency: 'EUR' as any,
        onClick: vi.fn(),
        actionLabel: 'View'
    };

    it('renders service details', () => {
        render(
            <BrowserRouter>
                <ServiceCard {...defaultProps} />
            </BrowserRouter>
        );
        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders image with lazy loading', () => {
        render(
            <BrowserRouter>
                <ServiceCard {...defaultProps} imageUrl="test.jpg" />
            </BrowserRouter>
        );
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'test.jpg');
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(img).toHaveAttribute('decoding', 'async');
    });

    it('does NOT render price', () => {
        render(
            <BrowserRouter>
                <ServiceCard {...defaultProps} rawPrice={undefined} />
            </BrowserRouter>
        );
        // Price was formatted as €100
        const priceElement = screen.queryByText('€100');
        expect(priceElement).not.toBeInTheDocument();

        // Also check if raw 100 is there securely
        const rawElement = screen.queryByText('100');
        expect(rawElement).not.toBeInTheDocument();
    });
});
