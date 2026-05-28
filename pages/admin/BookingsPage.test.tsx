import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingsPage } from './BookingsPage';
import { CurrencyProvider } from '../../context/CurrencyContext';
import { db } from '../../api-services';

vi.mock('../../api-services', () => ({
    db: {
        getAdminBookings: vi.fn(),
        updateBookingStatus: vi.fn(),
        updatePayoutStatus: vi.fn(),
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

    // --- filterStatus (server-side) ---

    it('calls getAdminBookings without filter when status is "all"', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        expect(db.getAdminBookings).toHaveBeenCalledWith(undefined);
    });

    it('calls getAdminBookings with status filter when a status tab is clicked', async () => {
        (db.getAdminBookings as any).mockResolvedValue([mockBookings[0]]);

        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /^Pending$/i }));

        await waitFor(() => {
            expect(db.getAdminBookings).toHaveBeenCalledWith('pending');
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

        const dateInputs = screen.getAllByDisplayValue('');
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

        const confirmBtn = screen.getByTitle('Confirm');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(db.updateBookingStatus).toHaveBeenCalledWith('1', 'confirmed');
        });

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

        expect(screen.getByTitle('Confirm')).toBeInTheDocument();
    });

    // --- handlePayoutStatusChange ---

    it('handlePayoutStatusChange: calls db.updatePayoutStatus when user confirms', async () => {
        (db.updatePayoutStatus as any).mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderPage();

        await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

        const viewBtns = screen.getAllByTitle('View Details');
        fireEvent.click(viewBtns[0]);

        const markPaidBtn = await screen.findByRole('button', { name: /Mark Paid/i });
        fireEvent.click(markPaidBtn);

        await waitFor(() => {
            expect(db.updatePayoutStatus).toHaveBeenCalledWith('1', 'paid');
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
            expect(db.updatePayoutStatus).not.toHaveBeenCalled();
        });
    });
});