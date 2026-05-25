import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Rule 1: vi.hoisted + Rule 2: Standard mocks
const { mockLogout, mockOpenLogin, mockOpenRegister, mockToggleTheme, mockSetLanguage, mockSetCurrency } = vi.hoisted(() => ({
    mockLogout: vi.fn(),
    mockOpenLogin: vi.fn(),
    mockOpenRegister: vi.fn(),
    mockToggleTheme: vi.fn(),
    mockSetLanguage: vi.fn(),
    mockSetCurrency: vi.fn()
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../context/ThemeContext', () => ({
    useTheme: () => ({
        theme: 'light',
        toggleTheme: mockToggleTheme
    })
}));

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        setLanguage: mockSetLanguage
    })
}));

vi.mock('../../context/ModalContext', () => ({
    useModal: () => ({
        openLogin: mockOpenLogin,
        openRegister: mockOpenRegister
    })
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        currency: 'EUR',
        setCurrency: mockSetCurrency
    })
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Sun: () => <svg data-testid="sun-icon" />,
    Moon: () => <svg data-testid="moon-icon" />,
    Globe: () => <svg data-testid="globe-icon" />,
    ChevronDown: ({ className }: any) => <svg data-testid="chevron-down" className={className} />,
    Home: () => <svg data-testid="home-icon" />,
    Car: () => <svg data-testid="car-icon" />,
    LogOut: () => <svg data-testid="logout-icon" />,
    User: () => <svg data-testid="user-icon" />,
    LayoutDashboard: () => <svg data-testid="dashboard-icon" />,
    Heart: () => <svg data-testid="heart-icon" />,
    Banknote: () => <svg data-testid="banknote-icon" />,
    ShoppingBag: () => <svg data-testid="shop-icon" />,
    BookOpen: () => <svg data-testid="book-open-icon" />,
    Building2: () => <svg data-testid="building-icon" />,
    MapPin: () => <svg data-testid="mappin-icon" />,
    MessageCircle: () => <svg data-testid="message-circle-icon" />,
    Users: () => <svg data-testid="users-icon" />
}));

vi.mock('./NavModeToggle', () => ({
    NavModeToggle: ({ mode, setMode }: any) => (
        <div data-testid="nav-mode-toggle">
            <button onClick={() => setMode('directory')}>Directory</button>
            <button onClick={() => setMode('rental')}>Rental</button>
            <span>{mode}</span>
        </div>
    )
}));

// Import component after mocks
import { MobileMenu } from './MobileMenu';
import { useAuth } from '../../context/AuthContext';

describe('MobileMenu', () => {
    const mockOnClose = vi.fn();
    const mockSetMode = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Default auth state
        (useAuth as any).mockReturnValue({
            user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'user', avatar: 'avatar.jpg' },
            isAuthenticated: true,
            logout: mockLogout
        });
    });

    const renderMenu = (isOpen = true, mode: 'directory' | 'rental' = 'directory') => {
        return render(
            <MemoryRouter>
                <MobileMenu isOpen={isOpen} onClose={mockOnClose} mode={mode} setMode={mockSetMode} />
            </MemoryRouter>
        );
    };

    it('returns null if not open', () => {
        const { container } = renderMenu(false);
        expect(container.firstChild).toBeNull();
    });

    it('renders user info when authenticated', () => {
        renderMenu();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByAltText('Test User')).toHaveAttribute('src', 'avatar.jpg');
    });

    it('renders guest buttons when not authenticated', () => {
        (useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        });

        renderMenu();
        expect(screen.getByText('nav.login')).toBeInTheDocument();
        expect(screen.getByText('nav.signup')).toBeInTheDocument();
    });

    it('renders main navigation links in directory mode', () => {
        renderMenu();
        expect(screen.getByText('nav.directory')).toBeInTheDocument();
        expect(screen.getByText('nav.community')).toBeInTheDocument();
        expect(screen.getByText('shop')).toBeInTheDocument();
    });

    it('renders main navigation links in rental mode', () => {
        renderMenu(true, 'rental');
        expect(screen.getByText('directory.villas')).toBeInTheDocument();
        expect(screen.getByText('directory.apartments')).toBeInTheDocument();
        expect(screen.getByText('nav.vehicles')).toBeInTheDocument();
        expect(screen.getByText('nav.services')).toBeInTheDocument();
    });

    it('renders user links when authenticated', () => {
        renderMenu();
        expect(screen.getByText('nav.favorites')).toBeInTheDocument();
        expect(screen.getByText('nav.profile')).toBeInTheDocument();
        expect(screen.getByText('auth.logout')).toBeInTheDocument();
    });

    it('shows admin and host links if user has permissions', () => {
        (useAuth as any).mockReturnValue({
            user: { id: 'admin-1', name: 'Admin', role: 'admin' },
            isAuthenticated: true,
            logout: mockLogout
        });

        renderMenu();
        expect(screen.getByText('nav.admin_panel')).toBeInTheDocument();
        expect(screen.getByText('nav.host_dashboard')).toBeInTheDocument();
    });

    it('handles theme toggle', () => {
        renderMenu();
        // Current theme is 'light' (mocked), clicking Moon icon's parent button should trigger toggleTheme
        const moonBtn = screen.getByTestId('moon-icon').closest('button');
        fireEvent.click(moonBtn!);
        expect(mockToggleTheme).toHaveBeenCalled();
    });

    it('hides currency section in directory mode', () => {
        renderMenu(true, 'directory');
        expect(screen.queryByText('nav.currency')).not.toBeInTheDocument();
    });

    it('expands currency section and changes currency in rental mode', () => {
        renderMenu(true, 'rental');
        const currencyBtn = screen.getByText('nav.currency').closest('button');
        fireEvent.click(currencyBtn!);

        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('TRY')).toBeInTheDocument();

        fireEvent.click(screen.getByText('TRY'));
        expect(mockSetCurrency).toHaveBeenCalledWith('TRY');
    });

    it('expands language section and changes language', () => {
        renderMenu();
        const langBtn = screen.getByText('nav.language').closest('button');
        fireEvent.click(langBtn!);

        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Русский')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Русский'));
        expect(mockSetLanguage).toHaveBeenCalledWith('ru');
    });

    it('calls onClose when a directory link is clicked', () => {
        renderMenu();
        fireEvent.click(screen.getByText('nav.community'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls logout and onClose when logout clicked', () => {
        renderMenu();
        fireEvent.click(screen.getByText('auth.logout'));
        expect(mockLogout).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders listing CTA buttons in rental mode', () => {
        renderMenu(true, 'rental');
        expect(screen.getByText('nav.list_property')).toBeInTheDocument();
        expect(screen.getByText('nav.list_service')).toBeInTheDocument();
    });

    it('hides listing CTA buttons in directory mode', () => {
        renderMenu(true, 'directory');
        expect(screen.queryByText('nav.list_property')).not.toBeInTheDocument();
        expect(screen.queryByText('nav.list_service')).not.toBeInTheDocument();
    });

    it('calls onClose when listing CTA clicked in rental mode', () => {
        renderMenu(true, 'rental');
        fireEvent.click(screen.getByText('nav.list_property'));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
