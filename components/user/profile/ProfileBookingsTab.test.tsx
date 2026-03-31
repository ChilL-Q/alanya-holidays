import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileBookingsTab } from './ProfileBookingsTab';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('lucide-react', () => ({
    Package: () => <div data-testid="package-icon" />,
    Calendar: () => <div data-testid="calendar-icon" />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual as any, useNavigate: () => mockNavigate };
});

const renderTab = (props: any) =>
    render(<BrowserRouter><ProfileBookingsTab {...props} /></BrowserRouter>);

const mockBooking = {
    id: 'booking-abc123',
    status: 'confirmed',
    item_type: 'property',
    item_id: 'prop-1',
    total_price: 500,
    check_in: '2025-03-01',
    check_out: '2025-03-05',
    created_at: new Date().toISOString(),
    property: { title: 'Sea View Villa', images: ['http://img.jpg'] },
};

describe('ProfileBookingsTab', () => {
    it('renders the bookings heading', () => {
        renderTab({ bookings: [], loading: false, onCancelBooking: vi.fn() });
        expect(screen.getByText('profile.bookings')).toBeInTheDocument();
    });

    it('shows booking count badge', () => {
        renderTab({ bookings: [mockBooking], loading: false, onCancelBooking: vi.fn() });
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows empty state with explore button when no bookings', () => {
        renderTab({ bookings: [], loading: false, onCancelBooking: vi.fn() });
        expect(screen.getByText('profile.no_bookings')).toBeInTheDocument();
        expect(screen.getByText('profile.explore_button')).toBeInTheDocument();
    });

    it('navigates to /stays on explore button click', () => {
        renderTab({ bookings: [], loading: false, onCancelBooking: vi.fn() });
        fireEvent.click(screen.getByText('profile.explore_button'));
        expect(mockNavigate).toHaveBeenCalledWith('/stays');
    });

    it('shows loading skeletons when loading', () => {
        const { container } = renderTab({ bookings: [], loading: true, onCancelBooking: vi.fn() });
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders booking cards when bookings provided', () => {
        renderTab({ bookings: [mockBooking], loading: false, onCancelBooking: vi.fn() });
        expect(screen.getByText('Sea View Villa')).toBeInTheDocument();
        expect(screen.getByText('€500')).toBeInTheDocument();
    });

    it('shows confirmed status badge', () => {
        renderTab({ bookings: [mockBooking], loading: false, onCancelBooking: vi.fn() });
        expect(screen.getByText('confirmed')).toBeInTheDocument();
    });

    it('shows cancel button for active bookings', () => {
        renderTab({ bookings: [mockBooking], loading: false, onCancelBooking: vi.fn() });
        expect(screen.getByText('profile.cancel')).toBeInTheDocument();
    });

    it('hides cancel button for cancelled bookings', () => {
        const cancelledBooking = { ...mockBooking, status: 'cancelled' };
        renderTab({ bookings: [cancelledBooking], loading: false, onCancelBooking: vi.fn() });
        expect(screen.queryByText('profile.cancel')).not.toBeInTheDocument();
    });

    it('calls onCancelBooking when cancel button clicked', () => {
        const onCancelBooking = vi.fn();
        renderTab({ bookings: [mockBooking], loading: false, onCancelBooking });
        fireEvent.click(screen.getByText('profile.cancel'));
        expect(onCancelBooking).toHaveBeenCalledWith(mockBooking.id, mockBooking.created_at);
    });

    it('shows booking ID prefix in the card', () => {
        renderTab({ bookings: [mockBooking], loading: false, onCancelBooking: vi.fn() });
        // The booking id is sliced to 8 chars: 'booking-'
        expect(screen.getByText(/profile\.id_label/)).toBeInTheDocument();
    });

    it('shows service image when property has no image', () => {
        const serviceBooking = {
            ...mockBooking,
            property: null,
            service: { title: 'Car Rental', images: ['http://car.jpg'] }
        };
        renderTab({ bookings: [serviceBooking], loading: false, onCancelBooking: vi.fn() });
        expect(screen.getByText('Car Rental')).toBeInTheDocument();
    });
});
