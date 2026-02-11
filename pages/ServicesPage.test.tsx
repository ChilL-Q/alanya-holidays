import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServicesPage } from './ServicesPage';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock Currency Context
vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (price: number) => price,
        formatPrice: (price: number) => `€${price}`,
        currency: 'EUR'
    })
}));

// Mock useServicePrices
vi.mock('../hooks/useServicePrices', () => ({
    useServicePrices: () => ({
        minPrices: {}
    })
}));

// Mock Data
vi.mock('../data/services', () => ({
    SERVICES_DATA: [
        {
            id: 'car-rental-1',
            category: 'transport',
            subcategory: 'rental',
            title: 'Car Rental 1',
            description: 'Desc 1',
            price: 50,
            priceLabel: '/day',
            route: '/services/car-1'
        },
        {
            id: 'transfer-1',
            category: 'transport',
            subcategory: 'transfer',
            title: 'Transfer 1',
            description: 'Desc 2',
            price: 100,
            priceLabel: '/trip',
            route: '/services/transfer-1'
        },
        {
            id: 'other-service',
            category: 'experiences',
            title: 'Experience 1',
            description: 'Desc 3',
            price: 200,
            route: '/services/exp-1'
        }
    ]
}));

// Mock ServiceCard to avoid import issues in test environment
vi.mock('../components/services/ServiceCard', () => ({
    ServiceCard: ({ title }: any) => <div>{title}</div>
}));

describe('ServicesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders services page', () => {
        render(
            <MemoryRouter initialEntries={['/services']}>
                <Routes>
                    <Route path="/services" element={<ServicesPage />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText('services.hero.title')).toBeDefined();
    });

    it('shows all transport services by default', () => {
        render(
            <MemoryRouter initialEntries={['/services/transport']}>
                <Routes>
                    <Route path="/services/:category" element={<ServicesPage />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText('Car Rental 1')).toBeDefined();
        expect(screen.getByText('Transfer 1')).toBeDefined();
    });

    it('filters by rental subcategory', async () => {
        render(
            <MemoryRouter initialEntries={['/services/transport']}>
                <Routes>
                    <Route path="/services/:category" element={<ServicesPage />} />
                </Routes>
            </MemoryRouter>
        );

        const rentalButton = screen.getByText('Rentals');
        fireEvent.click(rentalButton);

        await waitFor(() => {
            expect(screen.queryByText('Car Rental 1')).toBeDefined();
            expect(screen.queryByText('Transfer 1')).toBeNull();
        });
    });

    it('filters by transfer subcategory', async () => {
        render(
            <MemoryRouter initialEntries={['/services/transport']}>
                <Routes>
                    <Route path="/services/:category" element={<ServicesPage />} />
                </Routes>
            </MemoryRouter>
        );

        const transferButton = screen.getByText('Transfers');
        fireEvent.click(transferButton);

        await waitFor(() => {
            expect(screen.queryByText('Transfer 1')).toBeDefined();
            expect(screen.queryByText('Car Rental 1')).toBeNull();
        });
    });

    it('does not show transport filters for other categories', () => {
        render(
            <MemoryRouter initialEntries={['/services/experiences']}>
                <Routes>
                    <Route path="/services/:category" element={<ServicesPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByText('All Transport')).toBeNull();
        expect(screen.getByText('Experience 1')).toBeDefined();
    });
});
