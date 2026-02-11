import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportsPage } from './ReportsPage';
import { supabase } from '../../api-services/supabase';

// Mock Supabase
// Mock Supabase
vi.mock('../../api-services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
    }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

// Mock components/icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        MoreVertical: () => <div data-testid="more-vertical-icon" />,
        // Mock other icons to avoid rendering large SVGs in snapshot/DOM
    };
});

describe('ReportsPage', () => {
    const mockReports = [
        {
            id: '1',
            reporter_id: 'u1',
            reported_id: 'u2',
            conversation_id: 'c1',
            reason: 'Scam',
            description: 'Trying to scam me',
            status: 'pending',
            created_at: new Date().toISOString(),
            reporter: { full_name: 'Reporter User', email: 'reporter@test.com' },
            reported: { full_name: 'Reported User', email: 'reported@test.com' }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock response
        // @ts-ignore
        supabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockReports, error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
        }));
    });

    it('renders reports list', async () => {
        render(<ReportsPage />);
        expect(await screen.findByText('Reporter User')).toBeInTheDocument();
        expect(screen.getByText('Scam')).toBeInTheDocument();
    });

    it('opens action menu on clicking three dots', async () => {
        render(<ReportsPage />);
        await screen.findByText('Reporter User');

        const menuBtn = screen.getByTestId('more-vertical-icon').parentElement;
        fireEvent.click(menuBtn!);

        // Look for menu items which are rendered in a Portal
        expect(await screen.findByText('Mark Resolved')).toBeInTheDocument();
        expect(screen.getByText('Investigate')).toBeInTheDocument();
    });

    it('navigates to conversation on "View Chat Context"', async () => {
        render(<ReportsPage />);
        await screen.findByText('Reporter User');

        // Open menu
        const menuBtn = screen.getByTestId('more-vertical-icon').parentElement;
        fireEvent.click(menuBtn!);

        // Click View Chat Context
        const viewChatBtn = await screen.findByText('View Chat Context');
        fireEvent.click(viewChatBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/inbox?conversationId=c1');
    });
});
