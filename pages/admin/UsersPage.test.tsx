import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
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

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    db: {
        getAllUsers: vi.fn()
    }
}));

vi.mock('react-hot-toast', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
    default: { error: vi.fn(), success: vi.fn() },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Search: () => <svg data-testid="search-icon" />,
    Edit2: () => <svg data-testid="edit-icon" />,
    Trash2: () => <svg data-testid="trash-icon" />,
    Mail: () => <svg data-testid="mail-icon" />,
    Shield: () => <svg data-testid="shield-icon" />
}));

// Import component after mocks
import { UsersPage } from './UsersPage';
import { db } from '../../api-services';

describe('UsersPage', () => {
    const mockPagination = { page: 1, limit: 1000, total: 3, totalPages: 1 };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    const mockUsers = [
        { id: '1', full_name: 'Admin User', email: 'admin@test.com', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', full_name: 'Host User', email: 'host@test.com', role: 'host', created_at: '2024-01-02T00:00:00Z' },
        { id: '3', full_name: 'Guest User', email: 'guest@test.com', role: 'guest', created_at: '2024-01-03T00:00:00Z' }
    ];

    const renderUsersPage = () => {
        return render(
            <MemoryRouter>
                <UsersPage />
            </MemoryRouter>
        );
    };

    it('shows loading state initially', () => {
        (db.getAllUsers as any).mockReturnValue(new Promise(() => {})); // Never resolves
        renderUsersPage();
        expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('renders users table after fetch', async () => {
        (db.getAllUsers as any).mockResolvedValue({ data: mockUsers, pagination: mockPagination });
        renderUsersPage();

        await waitFor(() => {
            expect(screen.getByText('Admin User')).toBeInTheDocument();
            expect(screen.getByText('host@test.com')).toBeInTheDocument();
            expect(screen.getByText('GUEST')).toBeInTheDocument();
        });
    });

    it('shows empty state when no users found', async () => {
        (db.getAllUsers as any).mockResolvedValue({ data: [], pagination: { page: 1, limit: 1000, total: 0, totalPages: 0 } });
        renderUsersPage();

        await waitFor(() => {
            expect(screen.getByText('No users found.')).toBeInTheDocument();
        });
    });

    it('filters users by role', async () => {
        (db.getAllUsers as any).mockResolvedValue({ data: mockUsers, pagination: mockPagination });
        renderUsersPage();

        await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());

        const hostFilterBtn = screen.getByRole('button', { name: /Host/i });
        fireEvent.click(hostFilterBtn);

        expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
        expect(screen.getByText('Host User')).toBeInTheDocument();
    });

    it('filters users by search query', async () => {
        (db.getAllUsers as any).mockResolvedValue({ data: mockUsers, pagination: mockPagination });
        renderUsersPage();

        await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search users...');
        fireEvent.change(searchInput, { target: { value: 'guest' } });

        expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
        expect(screen.getByText('Guest User')).toBeInTheDocument();
    });

    it('navigates to edit user page on edit click', async () => {
        (db.getAllUsers as any).mockResolvedValue({ data: mockUsers, pagination: mockPagination });
        renderUsersPage();

        await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());

        const editBtns = screen.getAllByTitle('Edit');
        fireEvent.click(editBtns[0]);

        expect(mockNavigate).toHaveBeenCalledWith('/admin/edit-user/1');
    });

    it('handles delete click with confirmation', async () => {
        (db.getAllUsers as any).mockResolvedValue({ data: mockUsers, pagination: mockPagination });
        renderUsersPage();

        await waitFor(() => expect(screen.getByText('Admin User')).toBeInTheDocument());

        const deleteBtns = screen.getAllByTitle('Delete');
        fireEvent.click(deleteBtns[0]);

        expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure'));
        const { toast } = await import('react-hot-toast');
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Delete functionality would go here'));
    });

    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getAllUsers as any).mockRejectedValue(new Error('Fetch failed'));
        renderUsersPage();

        await waitFor(() => {
            expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
        });
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
