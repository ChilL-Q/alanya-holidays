import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileSettingsTab } from './ProfileSettingsTab';

vi.mock('../../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('lucide-react', () => ({
    UserCircle: () => <div data-testid="user-circle" />,
    Phone: () => <div data-testid="phone-icon" />,
    Home: () => <div data-testid="home-icon" />,
    Save: () => <div data-testid="save-icon" />,
    Globe: () => <div data-testid="globe-icon" />,
    Instagram: () => <div data-testid="instagram-icon" />,
    Facebook: () => <div data-testid="facebook-icon" />,
    Video: () => <div data-testid="video-icon" />,
    Music: () => <div data-testid="music-icon" />,
}));

const defaultProps = {
    profileForm: { name: 'John Doe', phone: '+90555000', companyName: '', socialLinks: {} },
    setProfileForm: vi.fn(),
    savingProfile: false,
    handleUpdateProfile: vi.fn(),
    isHostOrAdmin: false,
};

describe('ProfileSettingsTab', () => {
    it('renders personal info form', () => {
        render(<ProfileSettingsTab {...defaultProps} />);
        expect(screen.getByText('profile.personal_info')).toBeInTheDocument();
        expect(screen.getByText('auth.name')).toBeInTheDocument();
        expect(screen.getByText('profile.phone')).toBeInTheDocument();
    });

    it('displays current form values', () => {
        render(<ProfileSettingsTab {...defaultProps} />);
        const nameInput = screen.getByDisplayValue('John Doe');
        const phoneInput = screen.getByDisplayValue('+90555000');
        expect(nameInput).toBeInTheDocument();
        expect(phoneInput).toBeInTheDocument();
    });

    it('calls setProfileForm on name input change', () => {
        const setProfileForm = vi.fn();
        render(<ProfileSettingsTab {...defaultProps} setProfileForm={setProfileForm} />);
        const nameInput = screen.getByDisplayValue('John Doe');
        fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
        expect(setProfileForm).toHaveBeenCalled();
    });

    it('calls handleUpdateProfile on form submit', () => {
        const handleUpdateProfile = vi.fn();
        render(<ProfileSettingsTab {...defaultProps} handleUpdateProfile={handleUpdateProfile} />);
        const saveBtn = screen.getByRole('button');
        fireEvent.click(saveBtn);
        expect(handleUpdateProfile).toHaveBeenCalled();
    });

    it('shows company name field for host/admin', () => {
        render(<ProfileSettingsTab {...defaultProps} isHostOrAdmin={true} />);
        expect(screen.getByText('profile.company_name')).toBeInTheDocument();
    });

    it('hides company name field for regular user', () => {
        render(<ProfileSettingsTab {...defaultProps} isHostOrAdmin={false} />);
        expect(screen.queryByText('profile.company_name')).not.toBeInTheDocument();
    });

    it('shows submitting state when savingProfile is true', () => {
        render(<ProfileSettingsTab {...defaultProps} savingProfile={true} />);
        expect(screen.getByText('auth.submitting')).toBeInTheDocument();
    });

    it('disables save button when savingProfile is true', () => {
        render(<ProfileSettingsTab {...defaultProps} savingProfile={true} />);
        const saveBtn = screen.getByRole('button');
        expect(saveBtn).toBeDisabled();
    });
});
