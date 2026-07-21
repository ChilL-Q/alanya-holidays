import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate, mockToast } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockToast: {
        error: vi.fn(),
        success: vi.fn()
    }
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
    useAuth: vi.fn()
}));

vi.mock('react-hot-toast', () => ({
    default: mockToast
}));

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    usersService: {
        getUserProfile: vi.fn(),
        updateUserProfile: vi.fn()
    }
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    User: () => <svg />,
    Mail: () => <svg />,
    Phone: () => <svg />,
    Shield: () => <svg />,
    ArrowLeft: () => <svg />,
    Save: () => <svg />,
    Loader2: ({ className }: any) => <svg data-testid="loader" className={className} />
}));

// Import component after mocks
import { AdminEditUserPage } from './AdminEditUserPage';
import { useAuth } from '../../context/AuthContext';
import { usersService } from '../../api-services';

describe('AdminEditUserPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default admin auth state
        (useAuth as any).mockReturnValue({
            isAuthenticated: true,
            user: { id: 'admin-1', role: 'admin' },
            isLoading: false
        });
    });

    const renderPage = (userId = 'user-123') => {
        return render(
            <MemoryRouter initialEntries={[`/admin/edit-user/${userId}`]}>
                <Routes>
                    <Route path="/admin/edit-user/:id" element={<AdminEditUserPage />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders loading state while fetching user', () => {
        (usersService.getUserProfile as any).mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders user data in form fields', async () => {
        const mockUser = {
            id: 'user-123',
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+905551234567',
            role: 'host'
        };
        (usersService.getUserProfile as any).mockResolvedValue(mockUser);

        renderPage();

        await waitFor(() => {
            expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('+905551234567')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Host')).toBeInTheDocument();
        });
    });

    it('handles form submission successfully', async () => {
        const mockUser = { id: 'user-123', full_name: 'John Doe', email: 'john@example.com', role: 'host' };
        (usersService.getUserProfile as any).mockResolvedValue(mockUser);
        (usersService.updateUserProfile as any).mockResolvedValue({});

        renderPage();

        await waitFor(() => expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { name: 'full_name', value: 'John Smith' } });
        fireEvent.submit(screen.getByRole('button', { name: /Update Profile/i }));

        await waitFor(() => {
            expect(usersService.updateUserProfile).toHaveBeenCalledWith('user-123', expect.objectContaining({
                full_name: 'John Smith'
            }));
            expect(mockToast.success).toHaveBeenCalledWith('User updated successfully');
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });
    });

    it('handles API error when fetching user', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (usersService.getUserProfile as any).mockRejectedValue(new Error('Fetch error'));

        renderPage();

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to load user data');
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });
        
        consoleSpy.mockRestore();
    });

    it('redirects or returns null if not an admin', () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: true,
            user: { id: 'user-1', role: 'host' },
            isLoading: false
        });

        const { container } = renderPage();
        expect(container.firstChild).toBeNull();
    });

    it('handles save error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const mockUser = { id: 'user-123', full_name: 'John Doe', email: 'john@example.com', role: 'host' };
        (usersService.getUserProfile as any).mockResolvedValue(mockUser);
        (usersService.updateUserProfile as any).mockRejectedValue(new Error('Update failed'));

        renderPage();

        await waitFor(() => expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument());

        fireEvent.submit(screen.getByRole('button', { name: /Update Profile/i }));

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to update user');
        });
        
        consoleSpy.mockRestore();
    });
});
