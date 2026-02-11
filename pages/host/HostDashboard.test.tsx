import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HostDashboard } from './HostDashboard';
import { BrowserRouter } from 'react-router-dom';
import { db } from '../../api-services';
import { useAuth } from '../../context/AuthContext';

// Mock Recharts
vi.mock('recharts', () => {
    const OriginalModule = vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
        AreaChart: () => <div data-testid="area-chart">Area Chart</div>,
        Area: () => null,
        PieChart: () => <div data-testid="pie-chart">Pie Chart</div>,
        Pie: () => null,
        Cell: () => null,
        Tooltip: () => null,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null,
        Legend: () => null
    };
});

// Mock Dependencies
vi.mock('../../api-services', () => ({
    db: {
        getPropertiesByHost: vi.fn(),
        getServicesByProvider: vi.fn(),
        getBookingsForHost: vi.fn(),
        getUnreadMessagesCount: vi.fn()
    }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (p: number) => `€${p}`,
        convertPrice: (p: number) => p
    })
}));

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

describe('HostDashboard Analytics', () => {
    const mockUser = { id: 'user1', email: 'test@host.com', full_name: 'Test Host' };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: mockUser, isAuthenticated: true });
        (db.getPropertiesByHost as any).mockResolvedValue([]);
        (db.getServicesByProvider as any).mockResolvedValue([]);

        // Mock bookings for charts
        (db.getBookingsForHost as any).mockResolvedValue([
            {
                id: '1',
                created_at: new Date().toISOString(),
                status: 'confirmed',
                host_payout_amount: 100,
                payment_status: 'paid'
            },
            {
                id: '2',
                created_at: new Date().toISOString(),
                status: 'pending',
                host_payout_amount: 50,
                payment_status: 'unpaid'
            }
        ]);
        (db.getUnreadMessagesCount as any).mockResolvedValue(0);
    });

    it('renders analytics charts', async () => {
        render(
            <BrowserRouter>
                <HostDashboard />
            </BrowserRouter>
        );

        // Wait for loading to finish and content to appear
        await waitFor(() => {
            expect(screen.getByText('host.dashboard.welcome')).toBeInTheDocument();
        });

        // Check for analytics headers
        expect(screen.getByText('Earnings Trend')).toBeInTheDocument();

        // Check if chart mocks are rendered
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
});
