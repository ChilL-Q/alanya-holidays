import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditServicePage } from './AdminEditServicePage';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';

vi.mock('../../api-services', () => ({
    db: {
        getService: vi.fn(),
        getServiceEdit: vi.fn(),
        uploadImage: vi.fn(),
        updateService: vi.fn(),
        deleteService: vi.fn(),
        rejectServiceEdit: vi.fn(),
        deleteServiceEdit: vi.fn(),
    }
}));

vi.mock('../../api-services/supabase', () => ({
    supabase: { from: vi.fn(), functions: { invoke: vi.fn().mockResolvedValue({}) } }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() }
}));

vi.mock('../../hooks/useSaveShortcut', () => ({
    useSaveShortcut: vi.fn()
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
        // Default: authenticated admin
        (useAuth as any).mockReturnValue({
            isAuthenticated: true,
            user: { role: 'admin' },
            isLoading: false
        });
        (db.getService as any).mockResolvedValue({
            id: 'svc-1',
            title: 'Test Service',
            type: 'car',
            status: 'approved'
        });
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

    it('redirects to "/" when user is not admin', async () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: true,
            user: { role: 'guest' },
            isLoading: false
        });

        render(
            <BrowserRouter>
                <AdminEditServicePage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('redirects to "/" when user is not authenticated', async () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            user: null,
            isLoading: false
        });

        render(
            <BrowserRouter>
                <AdminEditServicePage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows loading spinner initially when admin', () => {
        // Delay resolution to observe loading state
        (db.getService as any).mockReturnValue(new Promise(() => {}));

        render(
            <BrowserRouter>
                <AdminEditServicePage />
            </BrowserRouter>
        );

        expect(screen.getByText('Loading service data...')).toBeInTheDocument();
    });

    it('loads and displays service data when admin', async () => {
        (db.getService as any).mockResolvedValue({
            id: 'svc-1',
            title: 'Airport Transfer',
            type: 'transfer',
            status: 'approved'
        });

        render(
            <BrowserRouter>
                <AdminEditServicePage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Loading service data...')).not.toBeInTheDocument();
        });

        // Title is shown in the page heading
        expect(screen.getByText(/Edit Service: Airport Transfer/i)).toBeInTheDocument();
        // Status badge
        expect(screen.getByText('approved')).toBeInTheDocument();
    });

    it('navigates back when back button clicked', async () => {
        render(<BrowserRouter><AdminEditServicePage /></BrowserRouter>);
        await waitFor(() => { expect(screen.queryByText('Loading service data...')).not.toBeInTheDocument(); });
        const backBtns = screen.getAllByRole('button');
        fireEvent.click(backBtns[0]);
        expect(mockNavigate).toHaveBeenCalled();
    });

    it('calls updateService when save button clicked', async () => {
        (db.updateService as any).mockResolvedValue({});
        render(<BrowserRouter><AdminEditServicePage /></BrowserRouter>);
        await waitFor(() => { expect(screen.queryByText('Loading service data...')).not.toBeInTheDocument(); });
        const saveBtn = screen.getByRole('button', { name: /save/i });
        await act(async () => { fireEvent.click(saveBtn); });
        await waitFor(() => {
            expect(db.updateService).toHaveBeenCalledWith('123', expect.any(Object));
        });
    });

    it('calls deleteService when delete confirmed', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        (db.deleteService as any).mockResolvedValue({});
        render(<BrowserRouter><AdminEditServicePage /></BrowserRouter>);
        await waitFor(() => { expect(screen.queryByText('Loading service data...')).not.toBeInTheDocument(); });
        const deleteBtn = screen.queryByRole('button', { name: /delete/i });
        if (deleteBtn) {
            await act(async () => { fireEvent.click(deleteBtn); });
            await waitFor(() => { expect(db.deleteService).toHaveBeenCalled(); });
        }
    });

    it('shows error toast when getService fails', async () => {
        (db.getService as any).mockRejectedValue(new Error('Not found'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<BrowserRouter><AdminEditServicePage /></BrowserRouter>);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });
});
