import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileSecurityTab } from './ProfileSecurityTab';

vi.mock('../../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('lucide-react', () => ({
    Key: () => <div data-testid="key-icon" />,
    Mail: () => <div data-testid="mail-icon" />,
    AlertTriangle: () => <div data-testid="alert-icon" />,
}));

const defaultProps = {
    userEmail: 'current@example.com',
    emailForm: { email: 'current@example.com', confirmEmail: '' },
    setEmailForm: vi.fn(),
    changingEmail: false,
    handleChangeEmail: vi.fn(),
    passwordForm: { newPassword: '', confirmPassword: '' },
    setPasswordForm: vi.fn(),
    changingPassword: false,
    handleChangePassword: vi.fn(),
};

describe('ProfileSecurityTab', () => {
    it('renders password change section', () => {
        render(<ProfileSecurityTab {...defaultProps} />);
        expect(screen.getByText('profile.change_password')).toBeInTheDocument();
        expect(screen.getByText('profile.new_password')).toBeInTheDocument();
        expect(screen.getByText('profile.confirm_password')).toBeInTheDocument();
    });

    it('renders email change section', () => {
        render(<ProfileSecurityTab {...defaultProps} />);
        expect(screen.getByText('profile.email_verify_title')).toBeInTheDocument();
        expect(screen.getByText('profile.current_email')).toBeInTheDocument();
        expect(screen.getByText('profile.new_email')).toBeInTheDocument();
    });

    it('has a disabled email input for current email', () => {
        render(<ProfileSecurityTab {...defaultProps} />);
        // The disabled input is the first email type input
        const inputs = document.querySelectorAll('input[type="email"]');
        expect(inputs[0]).toBeDisabled();
    });

    it('calls setPasswordForm on new password input change', () => {
        const setPasswordForm = vi.fn();
        render(<ProfileSecurityTab {...defaultProps} setPasswordForm={setPasswordForm} />);
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        fireEvent.change(passwordInputs[0], { target: { value: 'newpass123' } });
        expect(setPasswordForm).toHaveBeenCalled();
    });

    it('calls handleChangePassword on password form submit button click', () => {
        const handleChangePassword = vi.fn();
        render(<ProfileSecurityTab {...defaultProps} handleChangePassword={handleChangePassword} />);
        // Submit the password form by submitting the form element directly
        const forms = document.querySelectorAll('form');
        fireEvent.submit(forms[0]);
        expect(handleChangePassword).toHaveBeenCalled();
    });

    it('shows submitting text when changingPassword is true', () => {
        render(<ProfileSecurityTab {...defaultProps} changingPassword={true} />);
        expect(screen.getByText('auth.submitting')).toBeInTheDocument();
    });

    it('email submit button is disabled when email unchanged', () => {
        render(<ProfileSecurityTab {...defaultProps} />);
        const emailSubmitBtn = screen.getByText('profile.save_btn');
        expect(emailSubmitBtn).toBeDisabled();
    });

    it('email submit button enabled when email changed', () => {
        render(<ProfileSecurityTab {...defaultProps}
            emailForm={{ email: 'new@example.com', confirmEmail: '' }}
        />);
        const emailSubmitBtn = screen.getByText('profile.save_btn');
        expect(emailSubmitBtn).not.toBeDisabled();
    });

    it('calls setEmailForm on new email input change', () => {
        const setEmailForm = vi.fn();
        render(<ProfileSecurityTab {...defaultProps} setEmailForm={setEmailForm} />);
        const emailInputs = document.querySelectorAll('input[type="email"]');
        fireEvent.change(emailInputs[1], { target: { value: 'new@example.com' } });
        expect(setEmailForm).toHaveBeenCalled();
    });
});
