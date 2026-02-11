import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { db } from '../../api-services';
import { BrowserRouter } from 'react-router-dom';

// Mock DB
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
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: () => <div data-testid="area-chart" />,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => null,
    Cell: () => null
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    callback: any;
    constructor(callback: any) {
        this.callback = callback;
    }
    observe(target: any) {
        // Simulate immediate resize
        this.callback([{
            target,
            contentRect: { width: 500, height: 300 }
        }]);
    }
    unobserve() { }
    disconnect() { }
};

describe('Admin Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (db.getAdminProperties as any).mockResolvedValue({ count: 10 });
        (db.getAdminServices as any).mockResolvedValue({ count: 5 });
        (db.getAllUsers as any).mockResolvedValue(new Array(20).fill({}));
        (db.getBookingsByStatus as any).mockImplementation((status: string) => {
            if (status === 'confirmed') return [{ total_price: 100, created_at: new Date().toISOString() }];
            return [];
        });
    });

    it('renders dashboard stats', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        // Wait for stats to load
        const revenueLabel = await screen.findByText('Total Revenue');
        const revenueValue = revenueLabel.nextElementSibling;
        expect(revenueValue).toHaveTextContent(/€\s*100/);

        expect(screen.getByText('10')).toBeInTheDocument(); // Properties
        expect(screen.getByText('5')).toBeInTheDocument(); // Services
        expect(screen.getByText('20')).toBeInTheDocument(); // Users
    });

    it('renders charts', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        expect(await screen.findByTestId('area-chart')).toBeInTheDocument();
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
});
