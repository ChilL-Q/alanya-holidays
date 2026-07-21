import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Rule 1: vi.hoisted + Rule 2: Standard mocks
const { mockLogout, mockOpenLogin, mockOpenRegister } = vi.hoisted(() => ({
    mockLogout: vi.fn(),
    mockOpenLogin: vi.fn(),
    mockOpenRegister: vi.fn()
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../context/ModalContext', () => ({
    useModal: () => ({
        openLogin: mockOpenLogin,
        openRegister: mockOpenRegister
    })
}));

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (key: string) => key, language: 'en', setLanguage: vi.fn() })
}));

vi.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({ currency: 'USD', setCurrency: vi.fn() })
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    User: () => <svg data-testid="user-icon" />,
    LayoutDashboard: () => <svg data-testid="dashboard-icon" />,
    LogOut: () => <svg data-testid="logout-icon" />,
    PlusCircle: () => <svg data-testid="plus-circle-icon" />,
    ArrowRightLeft: () => <svg data-testid="arrow-right-left-icon" />,
    Sun: () => <svg data-testid="sun-icon" />,
    Moon: () => <svg data-testid="moon-icon" />
}));

// Import component after mocks
import { UserDropdown } from './UserDropdown';
import { useAuth } from '../../context/AuthContext';

describe('UserDropdown', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Default auth state
        (useAuth as any).mockReturnValue({
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'user' },
            isAuthenticated: true,
            logout: mockLogout
        });
    });

    const renderDropdown = (isOpen = true) => {
        return render(
            <MemoryRouter>
                <UserDropdown isOpen={isOpen} onClose={mockOnClose} />
            </MemoryRouter>
        );
    };

    it('returns null if not open', () => {
        const { container } = renderDropdown(false);
        expect(container.firstChild).toBeNull();
    });

    it('renders user info when authenticated', () => {
        renderDropdown();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders navigation links for authenticated user', () => {
        renderDropdown();
        expect(screen.getByText('nav.messages')).toBeInTheDocument();
        expect(screen.getByText('nav.profile')).toBeInTheDocument();
        expect(screen.getByText('auth.logout')).toBeInTheDocument();
    });

    it('shows admin panel link if user is admin', () => {
        (useAuth as any).mockReturnValue({
            user: { id: 'admin-1', name: 'Admin', role: 'admin' },
            isAuthenticated: true,
            logout: mockLogout
        });

        renderDropdown();
        expect(screen.getByText('nav.admin_panel')).toBeInTheDocument();
        expect(screen.getByText('nav.host_dashboard')).toBeInTheDocument();
    });

    it('shows host dashboard if user is host', () => {
        (useAuth as any).mockReturnValue({
            user: { id: 'host-1', name: 'Host', role: 'host' },
            isAuthenticated: true,
            logout: mockLogout
        });

        renderDropdown();
        expect(screen.queryByText('nav.admin_panel')).not.toBeInTheDocument();
        expect(screen.getByText('nav.host_dashboard')).toBeInTheDocument();
    });

    it('calls logout and onClose when logout clicked', () => {
        renderDropdown();
        fireEvent.click(screen.getByText('auth.logout'));
        expect(mockLogout).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders guest actions when not authenticated', () => {
        (useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        });

        renderDropdown();
        // Use getAllByText because labels appear twice (desktop and redundant mobile block)
        expect(screen.getAllByText('nav.login').length).toBeGreaterThan(0);
        expect(screen.getAllByText('nav.signup').length).toBeGreaterThan(0);
        expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });

    it('calls openLogin and onClose when login clicked', () => {
        (useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        });

        renderDropdown();
        const loginBtn = screen.getAllByText('nav.login')[0];
        fireEvent.click(loginBtn);
        expect(mockOpenLogin).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls openRegister and onClose when signup clicked', () => {
        (useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        });

        renderDropdown();
        const signupBtn = screen.getAllByText('nav.signup')[0];
        fireEvent.click(signupBtn);
        expect(mockOpenRegister).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when a navigation link is clicked', () => {
        renderDropdown();
        fireEvent.click(screen.getByText('nav.profile'));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
