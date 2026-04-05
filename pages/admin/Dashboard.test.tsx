import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { db } from '../../api-services';
import { BrowserRouter } from 'react-router-dom';

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    db: {
        getAdminProperties: vi.fn(),
        getAdminServices: vi.fn(),
        getAllUsers: vi.fn(),
        getBookingsByStatus: vi.fn()
    }
}));

// Mock Recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ data }: any) => <div data-testid="area-chart">{JSON.stringify(data)}</div>,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    PieChart: ({ data }: any) => <div data-testid="pie-chart">{JSON.stringify(data)}</div>,
    Pie: () => <div />,
    Cell: () => <div />
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    callback: any;
    constructor(callback: any) { this.callback = callback; }
    observe(target: any) {
        // Delay callback slightly to allow ref to be set if needed
        setTimeout(() => {
            this.callback([{
                target,
                contentRect: { width: 500, height: 300 }
            }]);
        }, 0);
    }
    unobserve() {}
    disconnect() {}
};

describe('Admin Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mocks
        (db.getAdminProperties as any).mockResolvedValue({ count: 10 });
        (db.getAdminServices as any).mockResolvedValue({ count: 5 });
        (db.getAllUsers as any).mockResolvedValue(new Array(20).fill({}));
        (db.getBookingsByStatus as any).mockImplementation((status: string) => {
            const now = new Date().toISOString();
            if (status === 'confirmed') return [
                { id: 'b1', total_price: 100, created_at: now, itemTitle: 'Villa' },
                { id: 'b2', total_price: 200, created_at: now, itemTitle: 'Apt' }
            ];
            if (status === 'completed') return [{ id: 'b3', total_price: 300, created_at: now }];
            if (status === 'pending') return [{ id: 'p1', created_at: now }];
            return [];
        });
    });

    it('shows loading spinner initially', () => {
        (db.getAllUsers as any).mockReturnValue(new Promise(() => {})); 
        render(<BrowserRouter><Dashboard /></BrowserRouter>);
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders dashboard stats correctly', async () => {
        render(<BrowserRouter><Dashboard /></BrowserRouter>);

        // Wait for stats to load
        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });

        const revenueValue = await screen.findByText(/€\s*600/);
        expect(revenueValue).toBeInTheDocument();

        expect(screen.getByText('10')).toBeInTheDocument(); 
        expect(screen.getByText('5')).toBeInTheDocument(); 
        expect(screen.getByText('20')).toBeInTheDocument(); 
    });

    it('calculates revenue history and status distribution for charts', async () => {
        render(<BrowserRouter><Dashboard /></BrowserRouter>);

        // Wait for charts
        await waitFor(() => {
            expect(screen.getByText('Confirmed')).toBeInTheDocument();
        });

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
        (db.getAllUsers as any).mockRejectedValue(new Error('Fetch error'));

        render(<BrowserRouter><Dashboard /></BrowserRouter>);

        // Component silently handles errors — stats remain at defaults
        await waitFor(() => {
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });

        // Verify no crash — component renders (loading state is cleared via finally)
        expect(screen.queryByText('Total Revenue')).toBeInTheDocument();
    });

    it('renders recent bookings widget', async () => {
        render(<BrowserRouter><Dashboard /></BrowserRouter>);
        
        await waitFor(() => {
            expect(screen.getByText('Villa')).toBeInTheDocument();
            expect(screen.getByText('Apt')).toBeInTheDocument();
        });
    });
});
