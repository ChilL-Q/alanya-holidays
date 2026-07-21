import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Profile } from './Profile';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { bookingsService, usersService, storageService } from '../api-services';
import { toast } from 'react-hot-toast';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate, mockLogout, mockUpdateUser, mockUpdateEmail, mockUpdatePassword, mockRefreshUser } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockLogout: vi.fn(),
    mockUpdateUser: vi.fn().mockResolvedValue(undefined),
    mockUpdateEmail: vi.fn().mockResolvedValue(undefined),
    mockUpdatePassword: vi.fn().mockResolvedValue(undefined),
    mockRefreshUser: vi.fn().mockResolvedValue(undefined),
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com', role: 'host' },
        isAuthenticated: true,
        logout: mockLogout,
        updateUser: mockUpdateUser,
        updateEmail: mockUpdateEmail,
        updatePassword: mockUpdatePassword,
        refreshUser: mockRefreshUser,
    })
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        loading: vi.fn().mockReturnValue('toast-id'),
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Rule 3: API mocks
vi.mock('../api-services', () => ({
    bookingsService: {
        getBookings: vi.fn().mockResolvedValue([]),
        cancelBooking: vi.fn().mockResolvedValue({}),
    },
    propertiesService: {
        getPropertiesByHost: vi.fn().mockResolvedValue([]),
    },
    servicesService: {
        getServicesByProvider: vi.fn().mockResolvedValue([]),
    },
    usersService: {
        getUserProfile: vi.fn().mockResolvedValue({
            full_name: 'Test User',
            email: 'test@example.com',
            role: 'host'
        }),
        updateUserProfile: vi.fn().mockResolvedValue({}),
    },
    storageService: {
        uploadAvatar: vi.fn().mockResolvedValue('https://example.com/new-avatar.jpg'),
    }
}));

// Mock sub-components to expose their action props for testing
vi.mock('../components/user/profile/ProfileSidebar', () => ({
    ProfileSidebar: ({ setActiveTab, handleAvatarUpload, handleLogout, setIsHostModalOpen, loading }: any) => (
        loading ? <div data-testid="sidebar-loading" /> : (
            <div data-testid="profile-sidebar">
                <button onClick={() => setActiveTab('settings')}>Go Settings</button>
                <button onClick={() => setActiveTab('security')}>Go Security</button>
                <button onClick={() => setActiveTab('payouts')}>Go Payouts</button>
                <button onClick={handleLogout}>Logout</button>
                <button onClick={() => setIsHostModalOpen(true)}>Open Host Modal</button>
                <input type="file" data-testid="avatar-input" onChange={handleAvatarUpload} />
            </div>
        )
    )
}));

vi.mock('../components/user/profile/ProfileBookingsTab', () => ({
    ProfileBookingsTab: ({ onCancelBooking, bookings, loading }: any) => (
        loading ? <div data-testid="bookings-loading" /> : (
            <div data-testid="bookings-tab">
                {bookings.map((b: any) => (
                    <button key={b.id} onClick={() => onCancelBooking(b.id, b.created_at)}>
                        Cancel {b.id}
                    </button>
                ))}
            </div>
        )
    )
}));

vi.mock('../components/user/profile/ProfileSettingsTab', () => ({
    ProfileSettingsTab: ({ handleUpdateProfile, profileForm, setProfileForm }: any) => (
        <form data-testid="settings-tab" onSubmit={handleUpdateProfile}>
            <input 
                data-testid="name-input" 
                value={profileForm.name} 
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} 
            />
            <button type="submit">Update Profile</button>
        </form>
    )
}));

vi.mock('../components/user/profile/ProfileSecurityTab', () => ({
    ProfileSecurityTab: ({ handleChangeEmail, handleChangePassword, setEmailForm, emailForm, setPasswordForm, passwordForm }: any) => (
        <div data-testid="security-tab">
            <form data-testid="email-form" onSubmit={handleChangeEmail}>
                <input 
                    data-testid="email-input" 
                    value={emailForm.email} 
                    onChange={(e) => setEmailForm({...emailForm, email: e.target.value})} 
                />
                <button type="submit">Change Email</button>
            </form>
            <form data-testid="password-form" onSubmit={handleChangePassword}>
                <input 
                    data-testid="password-input" 
                    value={passwordForm.newPassword} 
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value, confirmPassword: e.target.value})} 
                />
                <button type="submit">Change Password</button>
            </form>
        </div>
    )
}));

vi.mock('../components/user/profile/ProfilePayoutTab', () => ({
    ProfilePayoutTab: ({ handleUpdatePayout, setPayoutForm, payoutForm }: any) => (
        <form data-testid="payouts-tab" onSubmit={handleUpdatePayout}>
            <input 
                data-testid="iban-input" 
                value={payoutForm.iban} 
                onChange={(e) => setPayoutForm({...payoutForm, iban: e.target.value})} 
            />
            <button type="submit">Update Payout</button>
        </form>
    )
}));

vi.mock('../components/modals/BecomeHostModal', () => ({
    BecomeHostModal: ({ isOpen, onConfirm }: any) => isOpen ? (
        <div data-testid="host-modal">
            <button onClick={onConfirm}>Confirm Host</button>
        </div>
    ) : null
}));

// Dummy implementations for missing tabs
vi.mock('../components/user/profile/ProfilePropertiesTab', () => ({ ProfilePropertiesTab: () => <div /> }));
vi.mock('../components/user/profile/ProfileServicesTab', () => ({ ProfileServicesTab: () => <div /> }));

describe('Profile Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const renderProfile = () => {
        return render(
            <MemoryRouter initialEntries={['/profile']}>
                <Routes>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/" element={<div>Home</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('loads all data on mount', async () => {
        renderProfile();
        
        await waitFor(() => {
            expect(bookingsService.getBookings).toHaveBeenCalledWith('user-123');
            expect(usersService.getUserProfile).toHaveBeenCalledWith('user-123');
        });
    });

    it('handles avatar upload', async () => {
        renderProfile();
        await waitFor(() => expect(screen.queryByTestId('sidebar-loading')).not.toBeInTheDocument());
        
        const input = screen.getByTestId('avatar-input');
        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(storageService.uploadAvatar).toHaveBeenCalledWith(file);
            expect(usersService.updateUserProfile).toHaveBeenCalled();
            expect(mockUpdateUser).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('handles profile update', async () => {
        renderProfile();
        await waitFor(() => expect(screen.queryByTestId('sidebar-loading')).not.toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Go Settings'));
        
        const nameInput = screen.getByTestId('name-input');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        
        fireEvent.submit(screen.getByTestId('settings-tab'));

        await waitFor(() => {
            expect(usersService.updateUserProfile).toHaveBeenCalledWith('user-123', expect.objectContaining({
                full_name: 'New Name'
            }));
            expect(mockUpdateUser).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('handles payout update', async () => {
        renderProfile();
        await waitFor(() => expect(screen.queryByTestId('sidebar-loading')).not.toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Go Payouts'));
        
        const ibanInput = screen.getByTestId('iban-input');
        fireEvent.change(ibanInput, { target: { value: 'TR123' } });
        
        fireEvent.submit(screen.getByTestId('payouts-tab'));

        await waitFor(() => {
            expect(usersService.updateUserProfile).toHaveBeenCalledWith('user-123', expect.objectContaining({
                iban: 'TR123'
            }));
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('handles booking cancellation', async () => {
        const mockBookings = [{ id: 'b1', created_at: new Date().toISOString() }];
        (bookingsService.getBookings as any).mockResolvedValue(mockBookings);
        
        renderProfile();
        
        const cancelBtn = await screen.findByText('Cancel b1');
        fireEvent.click(cancelBtn);

        expect(window.confirm).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(bookingsService.cancelBooking).toHaveBeenCalledWith('b1');
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('handles email change', async () => {
        renderProfile();
        await waitFor(() => expect(screen.queryByTestId('sidebar-loading')).not.toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Go Security'));
        
        const emailInput = screen.getByTestId('email-input');
        fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
        
        fireEvent.submit(screen.getByTestId('email-form'));

        await waitFor(() => {
            expect(mockUpdateEmail).toHaveBeenCalledWith('new@email.com');
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('handles password change', async () => {
        renderProfile();
        await waitFor(() => expect(screen.queryByTestId('sidebar-loading')).not.toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Go Security'));
        
        const pwdInput = screen.getByTestId('password-input');
        fireEvent.change(pwdInput, { target: { value: 'new-password' } });
        
        fireEvent.submit(screen.getByTestId('password-form'));

        await waitFor(() => {
            expect(mockUpdatePassword).toHaveBeenCalledWith('new-password');
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('handles become host flow', async () => {
        renderProfile();
        await waitFor(() => expect(screen.queryByTestId('sidebar-loading')).not.toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Open Host Modal'));
        fireEvent.click(screen.getByText('Confirm Host'));

        await waitFor(() => {
            expect(usersService.updateUserProfile).toHaveBeenCalledWith('user-123', { role: 'host' });
            expect(mockUpdateUser).toHaveBeenCalledWith({ role: 'host' });
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it('handles logout', async () => {
        renderProfile();
        await waitFor(() => expect(screen.queryByTestId('sidebar-loading')).not.toBeInTheDocument());
        
        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
