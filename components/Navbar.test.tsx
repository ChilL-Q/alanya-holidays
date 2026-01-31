import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

import { useAuth } from '../context/AuthContext';

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
        // Check desktop links by text key
        expect(screen.getAllByText('nav.stays').length).toBeGreaterThan(0);
        expect(screen.getByText('nav.services')).toBeDefined();
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
        const loginBtns = screen.getAllByText('Login');
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
    });

    it('toggles currency dropdown', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        const currencyBtn = screen.getByText('EUR');
        fireEvent.click(currencyBtn);

        expect(screen.getByText('USD')).toBeDefined();

        fireEvent.click(screen.getByText('USD'));
        expect(mockSetCurrency).toHaveBeenCalledWith('USD');
    });

    it('toggles language dropdown', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        const langBtn = screen.getByText('en'); // uppercase in display span? 
        // Code: <span className="uppercase">{language}</span>
        // So 'en' displayed as 'en'? Or CSS uppercase. Text content is 'en'.

        fireEvent.click(langBtn);

        expect(screen.getByText('Türkçe')).toBeDefined();

        fireEvent.click(screen.getByText('Türkçe'));
        expect(mockSetLanguage).toHaveBeenCalledWith('tr');
    });
});
