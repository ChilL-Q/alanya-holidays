import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HostBookingsPage } from './HostBookingsPage';
import { db } from '../../api-services';
import { BrowserRouter } from 'react-router-dom';

const mockUser = { id: 'host-1', full_name: 'Test Host', role: 'host' };
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        isAuthenticated: true
    })
}));

vi.mock('../../api-services', () => ({
    db: {
        getBookingsForHost: vi.fn(),
        updateBookingStatus: vi.fn()
    }
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (price: number) => price,
        formatPrice: (price: number) => `€${price}`
    })
}));

describe('HostBookingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders and fetches bookings', async () => {
        (db.getBookingsForHost as any).mockResolvedValue([
            {
                id: 'booking-1',
                status: 'pending',
                itemTitle: 'Test Property',
                total_price: 100,
                check_in: '2025-01-01',
                check_out: '2025-01-05',
                user: { full_name: 'John Doe', email: 'john@example.com' },
                property: { location: 'Location 1' }
            }
        ]);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostBookingsPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(db.getBookingsForHost).toHaveBeenCalledWith('host-1');
        });

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Test Property')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('shows empty state when no bookings', async () => {
        (db.getBookingsForHost as any).mockResolvedValue([]);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostBookingsPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('No reservations found')).toBeInTheDocument();
    });
});
