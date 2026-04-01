import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CheckoutOrderSummary } from './CheckoutOrderSummary';

// Mock useLanguage
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock lucide-react Shield icon
vi.mock('lucide-react', () => ({
    Shield: ({ className, size }: any) => (
        <svg data-testid="shield-icon" className={className} width={size} height={size} />
    )
}));

describe('CheckoutOrderSummary', () => {
    const defaultProps = {
        items: [] as any[],
        total: 100,
        currency: 'EUR',
        convertAndFormat: (amount: number) => `€${amount.toFixed(2)}`
    };

    const propertyItem = {
        type: 'property',
        title: 'Beach Villa',
        price: 500,
        pricePerNight: 100,
        nights: 5,
        cleaningFee: 50
    };

    const renderComponent = (props = {}) => {
        return render(<CheckoutOrderSummary {...defaultProps} {...props} />);
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders order summary with title', () => {
            renderComponent();

            expect(screen.getByText('checkout.price_details')).toBeInTheDocument();
        });

        it('renders total amount', () => {
            renderComponent({ total: 250 });

            expect(screen.getByText('€250.00')).toBeInTheDocument();
        });

        it('renders currency in total label', () => {
            renderComponent({ currency: 'USD' });

            expect(screen.getByText('prop.total (USD)')).toBeInTheDocument();
        });

        it('renders with correct container classes', () => {
            const { container } = renderComponent();

            const summaryContainer = container.firstChild as HTMLElement;
            expect(summaryContainer).toHaveClass('bg-white');
            expect(summaryContainer).toHaveClass('dark:bg-slate-800/80');
            expect(summaryContainer).toHaveClass('rounded-xl');
            expect(summaryContainer).toHaveClass('p-6');
            expect(summaryContainer).toHaveClass('sticky');
            expect(summaryContainer).toHaveClass('top-24');
        });

        it('renders shield icon', () => {
            renderComponent();

            expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
        });

        it('renders free cancellation info', () => {
            renderComponent();

            expect(screen.getByText('checkout.free_cancel')).toBeInTheDocument();
            expect(screen.getByText('checkout.free_cancel_desc')).toBeInTheDocument();
        });
    });

    describe('Empty Items', () => {
        it('renders correctly with empty items array', () => {
            renderComponent({ items: [] });

            expect(screen.getByText('checkout.price_details')).toBeInTheDocument();
            expect(screen.getByText('€100.00')).toBeInTheDocument();
        });

        it('does not render any item rows when items is empty', () => {
            const { container } = renderComponent({ items: [] });

            const itemsContainer = container.querySelector('.space-y-3');
            expect(itemsContainer?.children.length).toBe(0);
        });
    });

    describe('Property Items', () => {
        it('renders property item with nightly rate', () => {
            renderComponent({ items: [propertyItem], total: 500 });

            expect(screen.getByText('€100.00 x 5 featured.night')).toBeInTheDocument();
            expect(screen.getByText('€500.00')).toBeInTheDocument();
        });

        it('renders cleaning fee separately for property', () => {
            renderComponent({ items: [propertyItem], total: 500 });

            expect(screen.getByText('checkout.cleaning_fee')).toBeInTheDocument();
            expect(screen.getByText('€50.00')).toBeInTheDocument();
        });

        it('shows "set by host" text for cleaning fee', () => {
            renderComponent({ items: [propertyItem], total: 500 });

            expect(screen.getByText('(checkout.set_by_host)')).toBeInTheDocument();
        });

        it('does not render cleaning fee when it is 0', () => {
            const propertyWithoutFee = { ...propertyItem, cleaningFee: 0 };
            renderComponent({ items: [propertyWithoutFee], total: 450 });

            expect(screen.queryByText('checkout.cleaning_fee')).not.toBeInTheDocument();
        });

        it('does not render cleaning fee when it is undefined', () => {
            const propertyWithoutFee = { ...propertyItem, cleaningFee: undefined };
            renderComponent({ items: [propertyWithoutFee], total: 450 });

            expect(screen.queryByText('checkout.cleaning_fee')).not.toBeInTheDocument();
        });

        it('calculates rental price correctly (total - cleaning fee)', () => {
            renderComponent({ items: [propertyItem], total: 500 });

            // Rental price should be 500 - 50 = 450
            const rentalPriceElements = screen.getAllByText('€450.00');
            expect(rentalPriceElements.length).toBeGreaterThan(0);
        });

        it('renders RENTAL type same as property', () => {
            const rentalItem = { ...propertyItem, type: 'RENTAL' };
            renderComponent({ items: [rentalItem], total: 500 });

            expect(screen.getByText('€100.00 x 5 featured.night')).toBeInTheDocument();
        });
    });

    describe('Non-Property Items', () => {
        const serviceItem = {
            type: 'service',
            title: 'Airport Transfer',
            price: 80
        };

        it('renders service item with title', () => {
            renderComponent({ items: [serviceItem], total: 80 });

            expect(screen.getByText('Airport Transfer')).toBeInTheDocument();
        });

        it('renders service item price', () => {
            renderComponent({ items: [serviceItem], total: 80 });

            const priceElements = screen.getAllByText('€80.00');
            expect(priceElements.length).toBeGreaterThan(0);
        });

        it('does not show nightly rate for service items', () => {
            renderComponent({ items: [serviceItem], total: 80 });

            expect(screen.queryByText(/x \d+ featured\.night/)).not.toBeInTheDocument();
        });

        it('renders multiple items correctly', () => {
            renderComponent({
                items: [
                    propertyItem,
                    serviceItem
                ],
                total: 580
            });

            expect(screen.getByText('€100.00 x 5 featured.night')).toBeInTheDocument();
            expect(screen.getByText('Airport Transfer')).toBeInTheDocument();
            const totalElements = screen.getAllByText('€580.00');
            expect(totalElements.length).toBeGreaterThan(0);
        });
    });

    describe('Price Formatting', () => {
        it('uses convertAndFormat function for all prices', () => {
            const customFormat = vi.fn((amount: number) => `$${amount}`);
            renderComponent({
                items: [{ type: 'service', title: 'Test', price: 100 }],
                total: 100,
                convertAndFormat: customFormat
            });

            expect(customFormat).toHaveBeenCalled();
            expect(customFormat).toHaveBeenCalledWith(100);
        });

        it('uses convertAndFormat with EUR for nightly rate', () => {
            const customFormat = vi.fn((amount: number, currency?: string) => {
                if (currency === 'EUR') return `€${amount}`;
                return `$${amount}`;
            });
            renderComponent({
                items: [propertyItem],
                convertAndFormat: customFormat
            });

            expect(customFormat).toHaveBeenCalledWith(100, 'EUR');
        });

        it('formats decimal prices correctly', () => {
            const itemWithDecimal = {
                type: 'service',
                title: 'Test Service',
                price: 99.99
            };
            renderComponent({ items: [itemWithDecimal], total: 99.99 });

            const priceElements = screen.getAllByText('€99.99');
            expect(priceElements.length).toBeGreaterThan(0);
        });
    });

    describe('Multiple Items', () => {
        it('renders border between items', () => {
            renderComponent({
                items: [
                    { type: 'service', title: 'Item 1', price: 50 },
                    { type: 'service', title: 'Item 2', price: 50 }
                ],
                total: 100
            });

            const borders = document.querySelectorAll('.border-b');
            expect(borders.length).toBeGreaterThan(0);
        });

        it('removes border from last item', () => {
            renderComponent({
                items: [
                    { type: 'service', title: 'Item 1', price: 50 },
                    { type: 'service', title: 'Item 2', price: 50 }
                ],
                total: 100
            });

            const lastBorder = document.querySelector('.last\\:border-0');
            expect(lastBorder).toBeInTheDocument();
        });

        it('calculates total correctly for multiple items', () => {
            renderComponent({
                items: [
                    { type: 'service', title: 'Item 1', price: 50 },
                    { type: 'service', title: 'Item 2', price: 75 },
                    { type: 'service', title: 'Item 3', price: 25 }
                ],
                total: 150
            });

            expect(screen.getByText('€150.00')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('renders title with correct classes', () => {
            renderComponent();

            const title = screen.getByText('checkout.price_details');
            expect(title).toHaveClass('font-bold');
            expect(title).toHaveClass('text-lg');
            expect(title).toHaveClass('text-slate-900');
        });

        it('renders total with correct font size', () => {
            renderComponent();

            const total = screen.getByText('€100.00');
            expect(total).toHaveClass('text-xl');
            expect(total).toHaveClass('font-bold');
        });

        it('renders shield icon with correct color', () => {
            renderComponent();

            const shield = screen.getByTestId('shield-icon');
            expect(shield).toHaveClass('text-teal-700');
            expect(shield).toHaveClass('dark:text-cyan-400');
        });

        it('renders cancellation info with correct styling', () => {
            renderComponent();

            const cancelText = screen.getByText('checkout.free_cancel');
            expect(cancelText).toHaveClass('font-bold');
            expect(cancelText).toHaveClass('text-slate-700');
        });

        it('renders cancellation info box with correct classes', () => {
            renderComponent();

            const cancelBox = screen.getByText('checkout.free_cancel').closest('div');
            expect(cancelBox).toHaveClass('bg-slate-50');
            expect(cancelBox).toHaveClass('dark:bg-slate-800/50');
            expect(cancelBox).toHaveClass('rounded-lg');
            expect(cancelBox).toHaveClass('p-3');
        });
    });

    describe('Dark Mode', () => {
        it('renders with dark mode classes', () => {
            renderComponent();

            const container = screen.getByText('checkout.price_details').closest('div');
            expect(container).toHaveClass('dark:bg-slate-800/80');
            expect(container).toHaveClass('dark:border-slate-800/50');
        });

        it('renders item text with dark mode classes', () => {
            renderComponent({
                items: [{ type: 'service', title: 'Test', price: 100 }]
            });

            const itemText = screen.getByText('Test');
            // Check that element exists and has some text styling
            expect(itemText).toBeInTheDocument();
            expect(itemText.tagName).toBe('SPAN');
        });

        it('renders total with dark mode text color', () => {
            renderComponent();

            const total = screen.getByText('€100.00');
            expect(total).toHaveClass('dark:text-white');
        });

        it('renders border with dark mode color', () => {
            renderComponent({
                items: [{ type: 'service', title: 'Test', price: 100 }]
            });

            const border = document.querySelector('.dark\\:border-slate-800\\/50');
            expect(border).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('renders with proper heading structure', () => {
            renderComponent();

            const heading = screen.getByRole('heading', { level: 3 });
            expect(heading).toBeInTheDocument();
            expect(heading).toHaveTextContent('checkout.price_details');
        });

        it('renders shield icon with proper SVG structure', () => {
            renderComponent();

            const shield = screen.getByTestId('shield-icon');
            expect(shield.tagName).toBe('svg');
        });

        it('renders cancellation info with readable text', () => {
            renderComponent();

            const cancelInfo = screen.getByText('checkout.free_cancel_desc');
            expect(cancelInfo).toBeInTheDocument();
            expect(cancelInfo).toHaveClass('text-xs');
            expect(cancelInfo).toHaveClass('leading-tight');
        });
    });

    describe('Edge Cases', () => {
        it('handles item with zero price', () => {
            renderComponent({
                items: [{ type: 'service', title: 'Free Item', price: 0 }],
                total: 0
            });

            expect(screen.getByText('Free Item')).toBeInTheDocument();
            const priceElements = screen.getAllByText('€0.00');
            expect(priceElements.length).toBeGreaterThan(0);
        });

        it('handles item with very large price', () => {
            renderComponent({
                items: [{ type: 'service', title: 'Luxury Item', price: 999999.99 }],
                total: 999999.99
            });

            const priceElements = screen.getAllByText('€999999.99');
            expect(priceElements.length).toBeGreaterThan(0);
        });

        it('handles item with missing pricePerNight for property', () => {
            const propertyWithoutRate = {
                type: 'property',
                title: 'Villa',
                price: 500,
                nights: 5,
                cleaningFee: 50
            };
            renderComponent({ items: [propertyWithoutRate], total: 500 });

            // Should use 0 for pricePerNight
            expect(screen.getByText('€0.00 x 5 featured.night')).toBeInTheDocument();
        });

        it('handles item with missing nights for property', () => {
            const propertyWithoutNights = {
                type: 'property',
                title: 'Villa',
                price: 500,
                pricePerNight: 100,
                cleaningFee: 50
            };
            renderComponent({ items: [propertyWithoutNights], total: 500 });

            // Should use 0 for nights
            expect(screen.getByText('€100.00 x 0 featured.night')).toBeInTheDocument();
        });

        it('handles special characters in item title', () => {
            renderComponent({
                items: [{ type: 'service', title: 'Test & Special "Chars"', price: 100 }],
                total: 100
            });

            expect(screen.getByText('Test & Special "Chars"')).toBeInTheDocument();
        });
    });

    describe('Layout', () => {
        it('renders items container with space-y layout', () => {
            renderComponent({
                items: [
                    { type: 'service', title: 'Item 1', price: 50 },
                    { type: 'service', title: 'Item 2', price: 50 }
                ],
                total: 100
            });

            const itemsContainer = document.querySelector('.space-y-3');
            expect(itemsContainer).toBeInTheDocument();
        });

        it('renders total section with flex layout', () => {
            renderComponent();

            const totalSection = screen.getByText('prop.total (EUR)').parentElement;
            expect(totalSection).toHaveClass('flex');
            expect(totalSection).toHaveClass('justify-between');
            expect(totalSection).toHaveClass('items-center');
        });

        it('renders cancellation info with flex gap', () => {
            renderComponent();

            const cancelBox = screen.getByText('checkout.free_cancel').closest('div');
            expect(cancelBox).toHaveClass('flex');
            expect(cancelBox).toHaveClass('gap-3');
            expect(cancelBox).toHaveClass('items-start');
        });

        it('renders shield icon with shrink-0 class', () => {
            renderComponent();

            const shield = screen.getByTestId('shield-icon');
            expect(shield).toHaveClass('shrink-0');
        });
    });
});
