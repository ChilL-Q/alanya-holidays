import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditServicePage } from './AdminEditServicePage';

vi.mock('../../api-services', () => ({
    db: {
        getService: vi.fn().mockResolvedValue({ id: '123', title: 'Test Service', type: 'car' }),
        updateService: vi.fn().mockResolvedValue({})
    }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { role: 'admin' }, isLoading: false })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: '123' }),
        useLocation: () => ({ search: '' })
    };
});

describe('AdminEditServicePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders service editor form fields', async () => {
        render(
            <BrowserRouter>
                <AdminEditServicePage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Loading service data...')).not.toBeInTheDocument();
        });

        // Basic Info section
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Price (€)')).toBeInTheDocument();
        
        // Settings Section
        expect(screen.getByText('Description')).toBeInTheDocument();
    });
});
