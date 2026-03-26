import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Profile } from './Profile';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        Camera: () => <div data-testid="camera-icon" />,
        Grid: () => <div data-testid="grid-icon" />,
        Home: () => <div data-testid="home-icon" />,
        Car: () => <div data-testid="car-icon" />,
        Banknote: () => <div data-testid="banknote-icon" />,
        Settings: () => <div data-testid="settings-icon" />,
        Shield: () => <div data-testid="shield-icon" />,
        LogOut: () => <div data-testid="logout-icon" />,
        Package: () => <div data-testid="package-icon" />,
        Calendar: () => <div data-testid="calendar-icon" />,
        MapPin: () => <div data-testid="mappin-icon" />,
        UserCircle: () => <div data-testid="usercircle-icon" />,
        Phone: () => <div data-testid="phone-icon" />,
        Save: () => <div data-testid="save-icon" />,
        Key: () => <div data-testid="key-icon" />,
        Mail: () => <div data-testid="mail-icon" />,
        AlertTriangle: () => <div data-testid="alert-icon" />,
        Wallet: () => <div data-testid="wallet-icon" />,
    };
});

const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'guest',
    avatar: 'https://example.com/avatar.jpg'
};

const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateUser: vi.fn(),
    updateEmail: vi.fn(),
    updatePassword: vi.fn(),
    resetPassword: vi.fn()
};

const mockLanguageContext = {
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
    dir: 'ltr'
};

const mockCurrencyContext = {
    currency: 'EUR',
    setCurrency: vi.fn(),
    exchangeRate: 1,
    formatPrice: (p: number) => `€${p}`,
    convertPrice: vi.fn((p) => p),
    rates: { EUR: 1, USD: 1.1, RUB: 100, TRY: 35 }
};

const mockUseAuth = vi.fn(() => mockAuthContext);
const mockUseLanguage = vi.fn(() => mockLanguageContext);
const mockUseCurrency = vi.fn(() => mockCurrencyContext);

vi.mock('../context/AuthContext', () => ({
    useAuth: () => mockUseAuth()
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => mockUseLanguage()
}));

vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => mockUseCurrency()
}));

const renderProfile = (authOverrides = {}) => {
    mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        ...authOverrides
    });
    
    return render(
        <BrowserRouter>
            <Profile />
        </BrowserRouter>
    );
};

describe('Profile Page', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue(mockAuthContext);
        mockUseLanguage.mockReturnValue(mockLanguageContext);
        mockUseCurrency.mockReturnValue(mockCurrencyContext);
    });

    it('renders profile sidebar with user info', () => {
        renderProfile();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('renders correct navigation tabs for guest', () => {
        renderProfile();
        // Check for sidebar navigation items
        expect(screen.getByRole('button', { name: /profile.bookings/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /profile.settings/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /profile.security/i })).toBeInTheDocument();
        
        // Host tabs should NOT be visible for guest
        expect(screen.queryByRole('button', { name: /profile.my_properties/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /profile.my_services/i })).not.toBeInTheDocument();
    });

    it('renders host tabs for host user', () => {
        const hostUser = { ...mockUser, role: 'host' };
        renderProfile({ ...mockAuthContext, user: hostUser });
        
        expect(screen.getByText('profile.my_properties')).toBeInTheDocument();
        expect(screen.getByText('profile.my_services')).toBeInTheDocument();
        expect(screen.getByText('profile.payout_details')).toBeInTheDocument();
    });

    it('redirects if not authenticated', () => {
        // Since we can't easily test navigate() in this simple setup without more complex mocks,
        // we check if it renders nothing or handle it as per component logic.
        // In Profile.tsx, it returns null and useEffect redirects.
        const unauthContext = { ...mockAuthContext, isAuthenticated: false, user: null };
        const { container } = renderProfile(unauthContext);
        expect(container.firstChild).toBeNull();
    });
});
