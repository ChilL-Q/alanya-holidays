import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertiesPage } from './PropertiesPage';
import { db } from '../../api-services';

vi.mock('../../api-services', () => ({
    db: {
        getAdminProperties: vi.fn(),
        approveProperty: vi.fn(),
        deleteProperty: vi.fn(),
        updatePropertyStatus: vi.fn()
    }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockNavigate
    };
});

const mockProperties = [
    { id: 1, title: 'Luxury Villa', location: 'Kargicak', price_per_night: 200, status: 'approved', type: 'villa' },
    { id: 2, title: 'Central Apartment', location: 'Alanya Center', price_per_night: 50, status: 'pending', type: 'apartment' }
];

describe('PropertiesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (db.getAdminProperties as any).mockResolvedValue({ data: mockProperties });
    });

    it('renders properties and filters them by search query', async () => {
        render(
            <BrowserRouter>
                <PropertiesPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Loading properties...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading properties...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
        expect(screen.getByText('Central Apartment')).toBeInTheDocument();

        // Search
        const searchInput = screen.getByPlaceholderText('Search properties...');
        fireEvent.change(searchInput, { target: { value: 'Central' } });

        expect(screen.queryByText('Luxury Villa')).not.toBeInTheDocument();
        expect(screen.getByText('Central Apartment')).toBeInTheDocument();
    });
});
