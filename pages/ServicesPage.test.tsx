import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Rule 1 & 2: vi.hoisted + standard mocks
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (amount: number) => `€${amount}`,
        convertPrice: (amount: number) => amount,
        currency: 'EUR'
    })
}));

vi.mock('../hooks/useServicePrices', () => ({
    useServicePrices: () => ({
        minPrices: { 's1': 50 },
        loading: false
    })
}));

// Rule 3: API/Data mocks
vi.mock('../data/services', () => ({
    SERVICES_DATA: [
        {
            id: 's1',
            category: 'transport',
            subcategory: 'rental',
            brand: 'Fiat',
            title: 'Fiat Egea',
            description: 'Economy car',
            price: 40,
            priceLabel: '40/day',
            image: 'fiat.jpg',
            icon: 'car',
            route: '/services/car-rental'
        },
        {
            id: 's2',
            category: 'experiences',
            title: 'Boat Trip',
            description: 'Full day trip',
            price: 60,
            priceLabel: '60/person',
            image: 'boat.jpg',
            icon: 'ship',
            route: '/services/boat-trip'
        }
    ]
}));

// Import component after mocks
import { ServicesPage } from './ServicesPage';

describe('ServicesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
    });

    const renderServicesPage = (category?: string) => {
        const path = category ? `/services/${category}` : '/services';
        return render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:category" element={<ServicesPage />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders hero title and default category (transport)', () => {
        renderServicesPage();
        expect(screen.getByText('services.hero.title')).toBeInTheDocument();
        expect(screen.getByText('Fiat Egea')).toBeInTheDocument();
        expect(screen.queryByText('Boat Trip')).not.toBeInTheDocument();
    });

    it('renders category from URL params', () => {
        renderServicesPage('experiences');
        expect(screen.getByText('Boat Trip')).toBeInTheDocument();
        expect(screen.queryByText('Fiat Egea')).not.toBeInTheDocument();
    });

    it('navigates when category tab is clicked', () => {
        renderServicesPage();
        const experiencesTab = screen.getByText('footer.experiences');
        fireEvent.click(experiencesTab);
        expect(mockNavigate).toHaveBeenCalledWith('/services/experiences');
    });

    it('filters transport by subcategory (rental/transfer)', () => {
        renderServicesPage();
        expect(screen.getByText('Fiat Egea')).toBeInTheDocument();

        const transferFilter = screen.getByText('Transfers');
        fireEvent.click(transferFilter);

        expect(screen.queryByText('Fiat Egea')).not.toBeInTheDocument();
        expect(screen.getByText('No services found matching your criteria.')).toBeInTheDocument();
    });

    it('shows and handles search filter', () => {
        renderServicesPage();
        fireEvent.click(screen.getByText('Show Filters'));

        const searchInput = screen.getByPlaceholderText('Search services...');
        fireEvent.change(searchInput, { target: { value: 'fiat' } });

        expect(screen.getByText('Fiat Egea')).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'luxury' } });
        expect(screen.queryByText('Fiat Egea')).not.toBeInTheDocument();
    });

    it('filters by price range', () => {
        renderServicesPage();
        fireEvent.click(screen.getByText('Show Filters'));

        const minPriceInput = screen.getByLabelText('Min Price (€)');
        const maxPriceInput = screen.getByLabelText('Max Price (€)');

        fireEvent.change(minPriceInput, { target: { value: '100' } });
        expect(screen.queryByText('Fiat Egea')).not.toBeInTheDocument();

        fireEvent.change(minPriceInput, { target: { value: '0' } });
        fireEvent.change(maxPriceInput, { target: { value: '30' } });
        expect(screen.queryByText('Fiat Egea')).not.toBeInTheDocument();
    });

    it('handles brand filter for transport', () => {
        renderServicesPage();
        fireEvent.click(screen.getByText('Show Filters'));

        const brandSelect = screen.getByLabelText('Brand');
        fireEvent.change(brandSelect, { target: { value: 'fiat' } });
        expect(screen.getByText('Fiat Egea')).toBeInTheDocument();

        fireEvent.change(brandSelect, { target: { value: 'bmw' } });
        expect(screen.queryByText('Fiat Egea')).not.toBeInTheDocument();
    });
});
