import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HostDashboard } from './HostDashboard';
import { propertiesService, bookingsService } from '../../api-services';
import { BrowserRouter } from 'react-router-dom';

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'host-1', name: 'Test Host', role: 'host' },
        isAuthenticated: true
    })
}));

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key })
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (price: number) => price,
        formatPrice: (price: number) => `€${price}`
    })
}));

vi.mock('../../api-services', () => ({
    propertiesService: {
        getPropertiesByHost: vi.fn()
    },
    bookingsService: {
        getBookingsForHost: vi.fn()
    }
}));

describe('HostDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders and fetches stats', async () => {
        (propertiesService.getPropertiesByHost as any).mockResolvedValue([
            { id: 'prop-1', title: 'Test Villa', rating: 4.8 }
        ]);

        (bookingsService.getBookingsForHost as any).mockResolvedValue([
            {
                id: 'booking-1',
                status: 'confirmed',
                payment_status: 'paid',
                host_payout_amount: 150,
                itemTitle: 'Test Villa',
                check_in: '2025-01-01',
                check_out: '2025-01-05',
                created_at: new Date().toISOString()
            }
        ]);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostDashboard />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(propertiesService.getPropertiesByHost).toHaveBeenCalledWith('host-1');
            expect(bookingsService.getBookingsForHost).toHaveBeenCalledWith('host-1');
        });

        // Ensure stats rendered correctly
        expect(screen.getAllByText('Test Villa')[0]).toBeInTheDocument(); // Recent bookings or properties list
        expect(screen.getByText('host.dashboard.welcome')).toBeInTheDocument();
    });
});
