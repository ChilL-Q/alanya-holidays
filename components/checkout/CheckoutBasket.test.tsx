import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CheckoutBasket } from './CheckoutBasket';
import { MemoryRouter } from 'react-router-dom';

// Mock Language Context
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Trash2: ({ className }: any) => <svg data-testid="trash-icon" className={className} />
}));

describe('CheckoutBasket', () => {
    const mockRemoveFromCart = vi.fn();
    const mockConvertAndFormat = vi.fn((amount: number) => `€${amount.toFixed(2)}`);

    const defaultProps = {
        items: [],
        removeFromCart: mockRemoveFromCart,
        convertAndFormat: mockConvertAndFormat
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <MemoryRouter>
                <CheckoutBasket {...defaultProps} {...props} />
            </MemoryRouter>
        );
    };

    it('renders empty basket state', () => {
        renderComponent({ items: [] });

        expect(screen.getByText('checkout.basket')).toBeInTheDocument();
        expect(screen.getByText('checkout.empty')).toBeInTheDocument();
        const startLink = screen.getByText('checkout.start');
        expect(startLink).toBeInTheDocument();
        expect(startLink.closest('a')).toHaveAttribute('href', '/');
    });

    it('renders items in the basket', () => {
        const items = [
            {
                id: '1',
                type: 'property',
                title: 'Luxury Villa',
                details: '3 Bedrooms, Private Pool',
                price: 500,
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-04-05T00:00:00.000Z',
                guests: 4
            },
            {
                id: '2',
                type: 'TRANSFER',
                title: 'Airport Transfer',
                details: 'Antalya Airport to Alanya',
                price: 100,
                date: '2026-04-01'
            }
        ];

        renderComponent({ items });

        // Check titles
        expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
        expect(screen.getByText('Airport Transfer')).toBeInTheDocument();

        // Check types labels
        expect(screen.getByText('STAY')).toBeInTheDocument();
        expect(screen.getByText('TRANSFER')).toBeInTheDocument();

        // Check details
        expect(screen.getByText('3 Bedrooms, Private Pool')).toBeInTheDocument();
        expect(screen.getByText('Antalya Airport to Alanya')).toBeInTheDocument();

        // Check prices (calls convertAndFormat)
        expect(screen.getByText('€500.00')).toBeInTheDocument();
        expect(screen.getByText('€100.00')).toBeInTheDocument();

        // Check guests
        expect(screen.getByText(/4 Guests/)).toBeInTheDocument();
    });

    it('displays dates correctly for property items', () => {
        const items = [
            {
                id: '1',
                type: 'property',
                title: 'Luxury Villa',
                details: '3 Bedrooms',
                price: 500,
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-04-05T00:00:00.000Z'
            }
        ];

        renderComponent({ items });

        // The exact string depends on locale, but it should contain parts of the date
        // Since we use .toLocaleDateString(), it's better to check if it's rendered
        const dateText = screen.getByText(/2026/);
        expect(dateText).toBeInTheDocument();
    });

    it('displays fixed date for non-property items', () => {
        const items = [
            {
                id: '2',
                type: 'TOUR',
                title: 'City Tour',
                details: 'Full day',
                price: 50,
                date: 'April 10, 2026'
            }
        ];

        renderComponent({ items });

        expect(screen.getByText(/April 10, 2026/)).toBeInTheDocument();
    });

    it('calls removeFromCart when trash icon is clicked', () => {
        const items = [
            {
                id: 'item-123',
                type: 'property',
                title: 'Luxury Villa',
                details: '3 Bedrooms',
                price: 500
            }
        ];

        renderComponent({ items });

        const removeButton = screen.getByTestId('trash-icon').closest('button');
        fireEvent.click(removeButton!);

        expect(mockRemoveFromCart).toHaveBeenCalledWith('item-123');
    });

    it('applies correct styling for property vs other types', () => {
        const items = [
            { id: '1', type: 'property', title: 'Stay', price: 100 },
            { id: '2', type: 'RENTAL', title: 'Car', price: 100 },
            { id: '3', type: 'TRANSFER', title: 'Ride', price: 100 }
        ];

        renderComponent({ items });

        const stayLabel = screen.getByText('STAY');
        const rentalLabel = screen.getByText('RENTAL');
        const transferLabel = screen.getByText('TRANSFER');

        expect(stayLabel).toHaveClass('bg-teal-100');
        expect(rentalLabel).toHaveClass('bg-teal-100');
        expect(transferLabel).toHaveClass('bg-orange-100');
    });
});
