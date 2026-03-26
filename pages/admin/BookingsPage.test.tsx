import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingsPage } from './BookingsPage';
import { CurrencyProvider } from '../../context/CurrencyContext';

vi.mock('../../api-services', () => ({
    db: {
        getAdminBookings: vi.fn(),
        updateBookingStatus: vi.fn()
    }
}));

describe('BookingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the admin bookings list with toolbar components', async () => {
        render(
            <BrowserRouter>
                <CurrencyProvider>
                    <BookingsPage />
                </CurrencyProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Loading bookings...')).not.toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('Search user, item, ID...')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Payout')).toBeInTheDocument();
    });
});
