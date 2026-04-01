import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { HostBookingsPage } from './HostBookingsPage';
import { db } from '../../api-services';
import { MemoryRouter } from 'react-router-dom';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'host-1', full_name: 'Test Host', role: 'host' },
        isAuthenticated: true
    })
}));

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    db: {
        getBookingsForHost: vi.fn(),
        updateBookingStatus: vi.fn()
    }
}));

// Mock sub-components
vi.mock('../../components/host/bookings/HostBookingToolbar', () => ({
    HostBookingToolbar: ({ onFilterStatus, onSearchTerm, _filterStatus, searchTerm }: any) => (
        <div data-testid="toolbar">
            <button onClick={() => onFilterStatus('confirmed')}>Filter Confirmed</button>
            <input 
                placeholder="Search..." 
                value={searchTerm} 
                onChange={e => onSearchTerm(e.target.value)} 
            />
        </div>
    )
}));

vi.mock('../../components/host/bookings/HostBookingTable', () => ({
    HostBookingTable: ({ bookings, isLoading, onViewDetails, onStatusUpdate }: any) => (
        <div data-testid="table">
            {isLoading ? (
                <span>Loading...</span>
            ) : bookings.length === 0 ? (
                <span>No bookings</span>
            ) : (
                bookings.map((b: any) => (
                    <div key={b.id}>
                        <span>{b.user?.full_name}</span>
                        <span>{b.status}</span>
                        <button onClick={() => onViewDetails(b)}>View</button>
                        <button onClick={() => onStatusUpdate(b.id, 'confirmed')}>Confirm</button>
                    </div>
                ))
            )}
        </div>
    )
}));

vi.mock('../../components/host/bookings/HostBookingDetailsModal', () => ({
    HostBookingDetailsModal: ({ booking, onClose, onStatusUpdate }: any) => booking ? (
        <div data-testid="details-modal">
            <h2>{booking.user?.full_name}</h2>
            <button onClick={() => onStatusUpdate(booking.id, 'cancelled')}>Cancel From Modal</button>
            <button onClick={onClose}>Close</button>
        </div>
    ) : null
}));

describe('HostBookingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('confirm', vi.fn(() => true));
        vi.stubGlobal('alert', vi.fn());
    });

    const mockBookings = [
        { 
            id: 'b1', 
            status: 'pending', 
            itemTitle: 'Luxury Villa', 
            user: { full_name: 'John Doe' } 
        },
        { 
            id: 'b2', 
            status: 'confirmed', 
            itemTitle: 'Boat Trip', 
            user: { full_name: 'Jane Smith' } 
        }
    ];

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <HostBookingsPage />
            </MemoryRouter>
        );
    };

    it('renders and loads bookings', async () => {
        (db.getBookingsForHost as any).mockResolvedValue(mockBookings);
        
        renderPage();

        expect(screen.getByText('Reservations')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        await waitFor(() => {
            expect(db.getBookingsForHost).toHaveBeenCalledWith('host-1');
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
    });

    it('filters bookings by status', async () => {
        (db.getBookingsForHost as any).mockResolvedValue(mockBookings);
        renderPage();

        await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Filter Confirmed'));

        await waitFor(() => {
            expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
    });

    it('filters bookings by search term', async () => {
        (db.getBookingsForHost as any).mockResolvedValue(mockBookings);
        renderPage();

        await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search...');
        fireEvent.change(searchInput, { target: { value: 'Jane' } });

        await waitFor(() => {
            expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
    });

    it('handles status update with confirmation', async () => {
        (db.getBookingsForHost as any).mockResolvedValue(mockBookings);
        (db.updateBookingStatus as any).mockResolvedValue({});
        
        renderPage();

        await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

        const confirmBtn = screen.getAllByText('Confirm')[0];
        fireEvent.click(confirmBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(db.updateBookingStatus).toHaveBeenCalledWith('b1', 'confirmed');
        
        await waitFor(() => {
            // Filter text "confirmed" is also on screen, so we count
            const confirmedStatuses = screen.getAllByText('confirmed');
            expect(confirmedStatuses.length).toBe(2);
        });
    });

    it('handles status update error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getBookingsForHost as any).mockResolvedValue(mockBookings);
        (db.updateBookingStatus as any).mockRejectedValue(new Error('Update failed'));
        
        renderPage();

        await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

        fireEvent.click(screen.getAllByText('Confirm')[0]);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Failed to update booking status');
            expect(consoleSpy).toHaveBeenCalled();
        });
        
        consoleSpy.mockRestore();
    });

    it('opens and closes details modal', async () => {
        (db.getBookingsForHost as any).mockResolvedValue(mockBookings);
        renderPage();

        await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

        fireEvent.click(screen.getAllByText('View')[0]);

        expect(screen.getByTestId('details-modal')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByTestId('details-modal')).not.toBeInTheDocument();
    });

    it('updates status from details modal', async () => {
        (db.getBookingsForHost as any).mockResolvedValue(mockBookings);
        (db.updateBookingStatus as any).mockResolvedValue({});
        
        renderPage();

        await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

        fireEvent.click(screen.getAllByText('View')[0]);
        fireEvent.click(screen.getByText('Cancel From Modal'));

        expect(db.updateBookingStatus).toHaveBeenCalledWith('b1', 'cancelled');
        
        await waitFor(() => {
            expect(screen.getByText('cancelled')).toBeInTheDocument();
        });
    });
});
