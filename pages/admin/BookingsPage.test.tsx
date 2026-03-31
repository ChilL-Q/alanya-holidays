import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingsPage } from './BookingsPage';
import { CurrencyProvider } from '../../context/CurrencyContext';
import { db } from '../../api-services';
import { supabase } from '../../api-services/supabase';

vi.mock('../../api-services', () => ({
    db: {
        getAdminBookings: vi.fn(),
        updateBookingStatus: vi.fn()
    }
}));

vi.mock('../../api-services/supabase', () => ({
    supabase: {
        from: vi.fn()
    }
}));

const mockBookings = [
    {
        id: '1',
        status: 'pending',
        payout_status: 'pending',
        itemTitle: 'Beach House',
        check_in: '2026-04-01',
        check_out: '2026-04-07',
        total_price: 500,
        item_type: 'property',
        user: { full_name: 'Alice', email: 'alice@test.com' }
    },
    {
        id: '2',
        status: 'confirmed',
        payout_status: 'pending',
        itemTitle: 'City Apt',
        check_in: '2026-04-15',
        check_out: '2026-04-20',
        total_price: 300,
        item_type: 'property',
        user: { full_name: 'Bob', email: 'bob@test.com' }
    },
];

const renderPage = () =>
    render(
        <BrowserRouter>
            <CurrencyProvider>
                <BookingsPage />
            </CurrencyProvider>
        </BrowserRouter>
    );

describe('BookingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (db.getAdminBookings as any).mockResolvedValue(mockBookings);
    });

    it('renders the admin bookings list with toolbar components', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('Search user, item, ID...')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Payout')).toBeInTheDocument();
    });

    // --- filterStatus ---

    it('filtering by status: shows only pending bookings', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        // Both bookings visible initially
        expect(screen.getByText('Bob')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /^Pending$/i }));

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.queryByText('Bob')).not.toBeInTheDocument();
        });
    });

    it('filtering by status: shows only confirmed bookings', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /^Confirmed$/i }));

        await waitFor(() => {
            expect(screen.getByText('Bob')).toBeInTheDocument();
            expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        });
    });

    it('filtering by status: shows no bookings when none match', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /^Completed$/i }));

        await waitFor(() => {
            expect(screen.getByText('No bookings found matching your filters.')).toBeInTheDocument();
        });
    });

    // --- searchQuery ---

    it('filtering by search query: matches user full_name', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Search user, item, ID...'), {
            target: { value: 'Alice' }
        });

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.queryByText('Bob')).not.toBeInTheDocument();
        });
    });

    it('filtering by search query: matches itemTitle', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('City Apt')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Search user, item, ID...'), {
            target: { value: 'City Apt' }
        });

        await waitFor(() => {
            expect(screen.getByText('City Apt')).toBeInTheDocument();
            expect(screen.queryByText('Beach House')).not.toBeInTheDocument();
        });
    });

    it('filtering by search query: matches booking id', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        // Search for id '2' — should show Bob, hide Alice
        fireEvent.change(screen.getByPlaceholderText('Search user, item, ID...'), {
            target: { value: '2' }
        });

        await waitFor(() => {
            expect(screen.getByText('Bob')).toBeInTheDocument();
            expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        });
    });

    // --- dateRange ---

    it('filtering by date range start: excludes bookings before start date', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        // Date inputs have empty value initially
        const dateInputs = screen.getAllByDisplayValue('');
        // First date input is start
        fireEvent.change(dateInputs[0], { target: { value: '2026-04-10' } });

        await waitFor(() => {
            expect(screen.getByText('Bob')).toBeInTheDocument();
            expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        });
    });

    it('filtering by date range end: excludes bookings after end date', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Bob')).toBeInTheDocument());

        const dateInputs = screen.getAllByDisplayValue('');
        // Second date input is end
        fireEvent.change(dateInputs[1], { target: { value: '2026-04-05' } });

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
            expect(screen.queryByText('Bob')).not.toBeInTheDocument();
        });
    });

    // --- handleStatusChange ---

    it('handleStatusChange: when user confirms, calls updateBookingStatus and updates state', async () => {
        (db.updateBookingStatus as any).mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        // BookingTable renders a "Confirm" button (title="Confirm") only for pending bookings
        const confirmBtn = screen.getByTitle('Confirm');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(db.updateBookingStatus).toHaveBeenCalledWith('1', 'confirmed');
        });

        // After update, the "Confirm" action button for booking '1' should no longer render
        // because its status is now 'confirmed' (not 'pending')
        await waitFor(() => {
            expect(screen.queryByTitle('Confirm')).not.toBeInTheDocument();
        });
    });

    it('handleStatusChange: when user cancels confirm dialog, does nothing', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        const confirmBtn = screen.getByTitle('Confirm');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(db.updateBookingStatus).not.toHaveBeenCalled();
        });

        // Booking status remains unchanged — "Confirm" button still present for Alice's booking
        expect(screen.getByTitle('Confirm')).toBeInTheDocument();
    });

    // --- handlePayoutStatusChange ---

    it('handlePayoutStatusChange: calls supabase.from("bookings").update when user confirms', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
        (supabase.from as any).mockReturnValue({ update: mockUpdate });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        // Open booking details modal for Alice's booking (id='1', payout_status='pending')
        const viewBtns = screen.getAllByTitle('View Details');
        fireEvent.click(viewBtns[0]);

        // Modal should appear with "Mark Paid" button (rendered when payout_status === 'pending')
        const markPaidBtn = await screen.findByRole('button', { name: /Mark Paid/i });
        fireEvent.click(markPaidBtn);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('bookings');
            expect(mockUpdate).toHaveBeenCalledWith({ payout_status: 'paid' });
            expect(mockEq).toHaveBeenCalledWith('id', '1');
        });
    });

    it('handlePayoutStatusChange: does nothing when user cancels confirm dialog', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        const viewBtns = screen.getAllByTitle('View Details');
        fireEvent.click(viewBtns[0]);

        const markPaidBtn = await screen.findByRole('button', { name: /Mark Paid/i });
        fireEvent.click(markPaidBtn);

        await waitFor(() => {
            expect(supabase.from).not.toHaveBeenCalled();
        });
    });
});
