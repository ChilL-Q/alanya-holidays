import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DirectoryAnalyticsPage } from './DirectoryAnalyticsPage';
import { ListingAnalyticsSummary } from '../../types/models';

const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        getDirectoryAnalyticsForOwner: vi.fn(),
        getCategoryAnalyticsAverage: vi.fn(),
    }
}));

vi.mock('../../api-services', () => ({
    db: mockDb
}));

const mockAnalytics: ListingAnalyticsSummary[] = [
    {
        listing_id: 'dir-1',
        listing_name: 'Test Clinic',
        listing_category_id: 'medical',
        total_views: 150,
        total_whatsapp_clicks: 12,
        total_website_clicks: 8,
        total_map_clicks: 5,
        daily_data: [
            { date: '2026-05-23', views: 10, whatsapp_clicks: 1, website_clicks: 0, map_clicks: 0 },
            { date: '2026-05-24', views: 20, whatsapp_clicks: 2, website_clicks: 1, map_clicks: 1 },
        ]
    }
];

describe('DirectoryAnalyticsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDb.getCategoryAnalyticsAverage.mockResolvedValue(null);
    });

    it('shows loading state initially', () => {
        mockDb.getDirectoryAnalyticsForOwner.mockReturnValue(new Promise(() => {}));
        render(<DirectoryAnalyticsPage />);
        expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('renders summary cards with correct totals', async () => {
        mockDb.getDirectoryAnalyticsForOwner.mockResolvedValue(mockAnalytics);
        render(<DirectoryAnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByText('150')).toBeInTheDocument();
        });

        expect(screen.getByText('Views')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('Website')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Map')).toBeInTheDocument();
    });

    it('renders chart section when daily data exists', async () => {
        mockDb.getDirectoryAnalyticsForOwner.mockResolvedValue(mockAnalytics);
        render(<DirectoryAnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByText('Daily Activity')).toBeInTheDocument();
        });

        // Verify the chart container div is present (ResponsiveContainer needs real DOM dimensions)
        const chartSection = screen.getByText('Daily Activity').closest('div')?.parentElement;
        expect(chartSection).toBeInTheDocument();
    });

    it('shows empty state when no listings', async () => {
        mockDb.getDirectoryAnalyticsForOwner.mockResolvedValue([]);
        render(<DirectoryAnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByText('No Analytics Yet')).toBeInTheDocument();
        });

        expect(screen.getByText(/Upgrade to Voyager to start tracking performance/)).toBeInTheDocument();
        expect(screen.getByText('List Your Business')).toHaveAttribute('href', '/list-business');
    });

    it('shows dropdown when multiple listings', async () => {
        const multi = [
            ...mockAnalytics,
            {
                listing_id: 'dir-2',
                listing_name: 'Second Clinic',
                listing_category_id: 'medical',
                total_views: 50,
                total_whatsapp_clicks: 5,
                total_website_clicks: 3,
                total_map_clicks: 2,
                daily_data: []
            }
        ];
        mockDb.getDirectoryAnalyticsForOwner.mockResolvedValue(multi);
        render(<DirectoryAnalyticsPage />);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        expect(screen.getByRole('combobox')).toHaveValue('0');
        expect(screen.getByText('Test Clinic')).toBeInTheDocument();
        expect(screen.getByText('Second Clinic')).toBeInTheDocument();
    });
});
