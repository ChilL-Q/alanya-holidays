import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CarModelDetails } from './CarModelDetails';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { AuthProvider } from '../context/AuthContext';
import { db } from '../api-services';

// Mock the API and other context dependencies
vi.mock('../api-services', () => ({
    db: {
        getServices: vi.fn(),
        getServiceModel: vi.fn(),
    }
}));

const mockOffers = [
    {
        id: '1',
        title: 'Toyota Corolla 2023',
        price: 50,
        description: 'Luxury sedan',
        features: { brand: 'Toyota', model: 'Corolla', year: 2023, transmission: 'automatic', fuel: 'hybrid' },
        images: ['toyota.jpg'],
        provider: { company_name: 'Alanya Rent', full_name: 'John Doe' }
    }
];

const renderWithProviders = (initialEntry = '/services/car/toyota-corolla') => {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <LanguageProvider>
                <CurrencyProvider>
                    <AuthProvider>
                        <Routes>
                            <Route path="/services/car/:modelId" element={<CarModelDetails />} />
                            <Route path="/services/car-rental" element={<div>Fleet Page</div>} />
                        </Routes>
                    </AuthProvider>
                </CurrencyProvider>
            </LanguageProvider>
        </MemoryRouter>
    );
};

describe('CarModelDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (db.getServices as any).mockResolvedValue({ data: mockOffers });
        (db.getServiceModel as any).mockResolvedValue({ description: 'Test Description', image_url: 'test.jpg' });
    });

    it('renders loading state initially', () => {
        renderWithProviders();
        expect(screen.getByText(/Loading offers/i)).toBeInTheDocument();
    });

    it('renders model info and offers after loading', async () => {
        renderWithProviders();
        
        await waitFor(() => {
            expect(screen.getByText('Toyota Corolla')).toBeInTheDocument();
            expect(screen.getByText('Available Offers (1)')).toBeInTheDocument();
            expect(screen.getByText('Alanya Rent')).toBeInTheDocument();
        });
    });

    it('opens modal when clicking on an offer card', async () => {
        renderWithProviders();
        
        await waitFor(() => {
            const card = screen.getByText('Alanya Rent').closest('div');
            if (card) fireEvent.click(card);
        });

        await waitFor(() => {
            expect(screen.getByText('Toyota Corolla 2023')).toBeInTheDocument();
            expect(screen.getByText('Features')).toBeInTheDocument();
        });
    });

    it('navigates back to fleet when clicking back button', async () => {
        renderWithProviders();
        
        await waitFor(() => {
            const backButton = screen.getByText(/Back to Fleet/i);
            fireEvent.click(backButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText('Fleet Page')).toBeInTheDocument();
        });
    });
});
