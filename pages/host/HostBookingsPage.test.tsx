import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
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

    it('filters bookings by status when filter button clicked', async () => {
        (db.getBookingsForHost as any).mockResolvedValue([
            { id: 'b1', status: 'pending', itemTitle: 'Prop A', total_price: 100, check_in: '2025-01-01', check_out: '2025-01-05', user: { full_name: 'Alice', email: 'a@test.com' } },
            { id: 'b2', status: 'confirmed', itemTitle: 'Prop B', total_price: 200, check_in: '2025-02-01', check_out: '2025-02-05', user: { full_name: 'Bob', email: 'b@test.com' } },
        ]);

        await act(async () => {
            render(<BrowserRouter><HostBookingsPage /></BrowserRouter>);
        });

        await waitFor(() => { expect(screen.getByText('Alice')).toBeInTheDocument(); });

        // Click 'pending' filter
        fireEvent.click(screen.getByRole('button', { name: 'pending' }));
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('filters bookings by search term', async () => {
        (db.getBookingsForHost as any).mockResolvedValue([
            { id: 'b1', status: 'pending', itemTitle: 'Beach Villa', total_price: 100, check_in: '2025-01-01', check_out: '2025-01-05', user: { full_name: 'Alice', email: 'a@test.com' } },
            { id: 'b2', status: 'confirmed', itemTitle: 'Mountain Cabin', total_price: 200, check_in: '2025-02-01', check_out: '2025-02-05', user: { full_name: 'Bob', email: 'b@test.com' } },
        ]);

        await act(async () => {
            render(<BrowserRouter><HostBookingsPage /></BrowserRouter>);
        });

        await waitFor(() => { expect(screen.getByText('Alice')).toBeInTheDocument(); });

        const searchInput = screen.getByPlaceholderText('Search guests, properties, or ID...');
        fireEvent.change(searchInput, { target: { value: 'Beach' } });
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('handles error when getBookingsForHost fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getBookingsForHost as any).mockRejectedValue(new Error('Network error'));
        await act(async () => {
            render(<BrowserRouter><HostBookingsPage /></BrowserRouter>);
        });
        await waitFor(() => { expect(consoleSpy).toHaveBeenCalled(); });
        consoleSpy.mockRestore();
    });

    it('renders the Reservations heading', async () => {
        (db.getBookingsForHost as any).mockResolvedValue([]);
        await act(async () => {
            render(<BrowserRouter><HostBookingsPage /></BrowserRouter>);
        });
        expect(screen.getByText('Reservations')).toBeInTheDocument();
        expect(screen.getByText('Manage your guest bookings')).toBeInTheDocument();
    });

    it('filters bookings by item title via search', async () => {
        (db.getBookingsForHost as any).mockResolvedValue([
            { id: 'b1', status: 'pending', itemTitle: 'Beach Villa', total_price: 100, check_in: '2025-01-01', check_out: '2025-01-05', user: { full_name: 'Alice', email: 'a@test.com' } },
            { id: 'b2', status: 'pending', itemTitle: 'Mountain Cabin', total_price: 200, check_in: '2025-02-01', check_out: '2025-02-05', user: { full_name: 'Bob', email: 'b@test.com' } },
        ]);

        await act(async () => {
            render(<BrowserRouter><HostBookingsPage /></BrowserRouter>);
        });
        await waitFor(() => { expect(screen.getByText('Alice')).toBeInTheDocument(); });

        const searchInput = screen.getByPlaceholderText('Search guests, properties, or ID...');
        fireEvent.change(searchInput, { target: { value: 'Mountain' } });
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });
});
