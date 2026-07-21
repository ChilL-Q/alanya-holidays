import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';
import { BrowserRouter } from 'react-router-dom';

// Mock contexts
const mockOpenLogin = vi.fn();
const mockOpenRegister = vi.fn();
const mockLogout = vi.fn();
const mockSetLanguage = vi.fn();
const mockSetCurrency = vi.fn();
const mockSetIsCartOpen = vi.fn();
const mockToggleTheme = vi.fn();

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: null,
        isAuthenticated: false,
        logout: mockLogout
    }))
}));
vi.mock('../context/ModalContext', () => ({
    useModal: () => ({
        openLogin: mockOpenLogin,
        openRegister: mockOpenRegister
    })
}));
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        setLanguage: mockSetLanguage
    })
}));
vi.mock('../context/CartContext', () => ({
    useCart: () => ({
        items: [],
        setIsCartOpen: mockSetIsCartOpen
    })
}));
vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        currency: 'EUR',
        setCurrency: mockSetCurrency
    })
}));
vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({
        theme: 'light',
        toggleTheme: mockToggleTheme
    })
}));
vi.mock('../context/FavoritesContext', () => ({
    useFavorites: () => ({
        favorites: []
    })
}));
// Mock child components to simplify
vi.mock('./ui/NotificationBell', () => ({
    NotificationBell: () => <div data-testid="notification-bell">Bell</div>
}));
vi.mock('./navbar/MobileMenu', () => ({
    MobileMenu: () => <div data-testid="mobile-menu">MobileMenu</div>
}));
vi.mock('./navbar/NavIndicator', () => ({
    NavIndicator: () => <div data-testid="nav-indicator" />
}));
vi.mock('./navbar/NavModeToggle', () => ({
    NavModeToggle: () => <div data-testid="nav-mode-toggle" />
}));

import { useAuth } from '../context/AuthContext';

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('Navbar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset auth mock to default (guest)
        (useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: mockLogout
        });
    });

    it('renders logo and navigation links', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
        expect(screen.getByText('Alanya')).toBeDefined();
        // Default mode is 'directory', check for directory nav links
        expect(screen.getAllByText('nav.directory').length).toBeGreaterThan(0);
    });

    it('opens login modal when guest clicks profile -> login', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        // Click profile button
        fireEvent.click(screen.getByTestId('profile-button'));

        // Should show Login / Register buttons
        const loginBtns = screen.getAllByText('nav.login');
        expect(loginBtns.length).toBeGreaterThan(0);

        fireEvent.click(loginBtns[0]);
        expect(mockOpenLogin).toHaveBeenCalled();
    });

    it('displays user info when authenticated', () => {
        (useAuth as any).mockReturnValue({
            user: { name: 'Test User', email: 'test@test.com', avatar: 'img.jpg', role: 'guest' },
            isAuthenticated: true,
            logout: mockLogout
        });

        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        // Profile image should be visible inside the button
        const img = screen.getByAltText('Test User');
        expect(img).toBeDefined();

        // Open dropdown
        fireEvent.click(screen.getByTestId('profile-button'));

        expect(screen.getByText('Test User')).toBeDefined();
        expect(screen.getByText('test@test.com')).toBeDefined();
        expect(screen.getByText('auth.logout')).toBeDefined();

        // In directory mode, ListPropertyAction is hidden — neither list_property nor upgrade_btn visible
        expect(screen.queryByText('nav.list_property')).toBeNull();
        expect(screen.queryByText('profile.upgrade_btn')).toBeNull();
    });

    it('hides currency selector in directory mode', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        // Open dropdown
        fireEvent.click(screen.getByTestId('profile-button'));

        // Currency is hidden in directory mode (default)
        expect(screen.queryByText('EUR')).toBeNull();
    });

    it('toggles language dropdown', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        // Open dropdown
        fireEvent.click(screen.getByTestId('profile-button'));

        const ruBtn = screen.getByText('RU');
        expect(ruBtn).toBeDefined();

        fireEvent.click(ruBtn);
        expect(mockSetLanguage).toHaveBeenCalledWith('ru');
    });

    it('selects Turkish language', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByTestId('profile-button'));

        const trBtn = screen.getByText('TR');
        fireEvent.click(trBtn);
        expect(mockSetLanguage).toHaveBeenCalledWith('tr');
    });
});
