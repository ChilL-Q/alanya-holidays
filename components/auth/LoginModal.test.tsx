import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LoginModal } from './LoginModal';

// Mock useModal
const mockUseModal = vi.fn();
vi.mock('../../context/ModalContext', () => ({
    useModal: () => mockUseModal()
}));

// Mock useLanguage
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock useAuth
const mockLogin = vi.fn();
const mockSendOtp = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        sendOtp: mockSendOtp,
        verifyOtp: mockVerifyOtp
    })
}));

// Mock useSubmitShortcut
const mockUseSubmitShortcut = vi.fn();
vi.mock('../../hooks/useSubmitShortcut', () => ({
    useSubmitShortcut: (callback: any, disabled: any) => mockUseSubmitShortcut(callback, disabled)
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn()
    }
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Mail: ({ className }: any) => <svg data-testid="mail-icon" className={className} />,
    Lock: ({ className }: any) => <svg data-testid="lock-icon" className={className} />,
    AlertCircle: ({ className }: any) => <svg data-testid="alert-icon" className={className} />,
    Loader2: ({ className }: any) => <svg data-testid="loader-icon" className={className} />,
    ArrowLeft: ({ className }: any) => <svg data-testid="arrow-left-icon" className={className} />
}));

// Mock Modal component
vi.mock('../ui/Modal', () => ({
    Modal: ({ isOpen, onClose, title, children }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal" role="dialog">
                <div data-testid="modal-title">{title}</div>
                <div data-testid="modal-content">{children}</div>
                <button data-testid="modal-close" onClick={onClose}>Close</button>
            </div>
        );
    }
}));

import { useModal } from '../../context/ModalContext';
import { useSubmitShortcut } from '../../hooks/useSubmitShortcut';
import toast from 'react-hot-toast';

const mockCloseModal = vi.fn();
const mockOpenRegister = vi.fn();

describe('LoginModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseModal.mockReturnValue({
            activeModal: 'login',
            closeModal: mockCloseModal,
            openRegister: mockOpenRegister
        });
        mockLogin.mockReset();
        mockSendOtp.mockReset();
        mockVerifyOtp.mockReset();
        mockUseSubmitShortcut.mockReset();
        toast.success.mockClear();
    });

    const renderLoginModal = () => {
        return render(<LoginModal />);
    };

    describe('Modal Visibility', () => {
        it('renders modal when activeModal is "login"', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });
        });

        it('does not render modal when activeModal is not "login"', async () => {
            mockUseModal.mockReturnValue({
                activeModal: 'register',
                closeModal: mockCloseModal,
                openRegister: mockOpenRegister
            });

            renderLoginModal();

            expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        });
    });

    describe('Login Form Display', () => {
        it('renders login form by default', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal-title')).toHaveTextContent('auth.login.title');
            });
            expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
            expect(screen.getByText('auth.submit.login')).toBeInTheDocument();
        });

        it('renders email input with mail icon', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
            });
            const emailInput = screen.getByLabelText('auth.email');
            expect(emailInput).toHaveAttribute('type', 'email');
        });

        it('renders password input with lock icon', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
            });
            const passwordInput = screen.getByLabelText('auth.password');
            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        it('renders forgot password link', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByText('Forgot password?')).toBeInTheDocument();
            });
        });

        it('renders register link', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByText('auth.no_account')).toBeInTheDocument();
                expect(screen.getByText('auth.submit.register')).toBeInTheDocument();
            });
        });
    });

    describe('Login Form Functionality', () => {
        it('updates email input value', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText('hello@example.com');
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

            expect(emailInput).toHaveValue('test@example.com');
        });

        it('updates password input value', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const passwordInput = screen.getByPlaceholderText('••••••••');
            fireEvent.change(passwordInput, { target: { value: 'password123' } });

            expect(passwordInput).toHaveValue('password123');
        });

        it('calls login on form submit', async () => {
            mockLogin.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.login').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
            });
        });

        it('closes modal on successful login', async () => {
            mockLogin.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.login').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(mockCloseModal).toHaveBeenCalled();
            });
        });

        it('shows error on failed login', async () => {
            mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.login').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
            });
        });

        it('shows loading state during login', async () => {
            mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.login').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
            });
        });

        it('disables submit button during loading', async () => {
            mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.login').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(submitButton).toBeDisabled();
            });
        });

        it('navigates to recovery mode when forgot password is clicked', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByText('Reset Password')).toBeInTheDocument();
            });
        });

        it('navigates to register when register link is clicked', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const registerLink = screen.getByText('auth.submit.register');
            fireEvent.click(registerLink);

            expect(mockOpenRegister).toHaveBeenCalled();
        });
    });

    describe('Recovery Form', () => {
        it('renders recovery form when mode is recovery', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByText('Reset Password')).toBeInTheDocument();
                expect(screen.getByText(/Enter your email/)).toBeInTheDocument();
            });
        });

        it('shows back to login button in recovery mode', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByText('Back to Login')).toBeInTheDocument();
                expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
            });
        });

        it('calls sendOtp on recovery form submit', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(mockSendOtp).toHaveBeenCalledWith('test@example.com');
            });
        });

        it('switches to OTP mode on successful sendOtp', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Check your email')).toBeInTheDocument();
            });
        });

        it('shows error on failed sendOtp', async () => {
            mockSendOtp.mockResolvedValue({ success: false, error: 'Failed to send' });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Failed to send')).toBeInTheDocument();
            });
        });

        it('returns to login mode when back button is clicked', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByText('Reset Password')).toBeInTheDocument();
            });

            const backButton = screen.getByText('Back to Login');
            fireEvent.click(backButton);

            await waitFor(() => {
                expect(screen.getByText('auth.login.title')).toBeInTheDocument();
            });
        });
    });

    describe('OTP Form', () => {
        it('renders OTP form when mode is otp', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Check your email')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });
        });

        it('shows email in OTP message', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
            });
        });

        it('calls verifyOtp on OTP form submit', async () => {
            mockSendOtp.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Login').closest('button');

            fireEvent.change(otpInput, { target: { value: '123456' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(mockVerifyOtp).toHaveBeenCalledWith('test@example.com', '123456', 'email');
            });
        });

        it('closes modal and shows toast on successful OTP verification', async () => {
            mockSendOtp.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Login').closest('button');

            fireEvent.change(otpInput, { target: { value: '123456' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(mockCloseModal).toHaveBeenCalled();
                expect(toast.success).toHaveBeenCalledWith('Successfully logged in!');
            });
        });

        it('shows error on failed OTP verification', async () => {
            mockSendOtp.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: false, error: 'Invalid code' });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Login').closest('button');

            // Enter valid 6-digit code
            fireEvent.change(otpInput, { target: { value: '000000' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(screen.getByText('Invalid code')).toBeInTheDocument();
            });
        });

        it('filters non-numeric characters in OTP input', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            fireEvent.change(otpInput, { target: { value: '1a2b3c4d' } });

            expect(otpInput).toHaveValue('1234');
        });

        it('disables verify button when OTP is less than 6 digits', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Login').closest('button');

            fireEvent.change(otpInput, { target: { value: '123' } });

            expect(verifyButton).toBeDisabled();
        });

        it('calls handleResend when resend button is clicked', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Resend Code')).toBeInTheDocument();
            });

            const resendButton = screen.getByText('Resend Code');
            fireEvent.click(resendButton);

            await waitFor(() => {
                expect(mockSendOtp).toHaveBeenCalledWith('test@example.com');
            });
        });

        it('shows toast on successful resend', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Resend Code')).toBeInTheDocument();
            });

            const resendButton = screen.getByText('Resend Code');
            fireEvent.click(resendButton);

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Code resent to your email!');
            });
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('registers keyboard shortcut for login mode', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            expect(mockUseSubmitShortcut).toHaveBeenCalled();
        });

        it('calls handleLoginSubmit on keyboard shortcut in login mode', async () => {
            mockLogin.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Fill in the form
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });

            // Get the callback passed to useSubmitShortcut and call it
            const callback = mockUseSubmitShortcut.mock.calls[0][0];
            callback();

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalled();
            });
        });
    });

    describe('State Reset on Close', () => {
        it('resets mode to login when modal closes', async () => {
            const { rerender } = renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Switch to recovery mode
            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByText('Reset Password')).toBeInTheDocument();
            });

            // Close and reopen modal
            mockUseModal.mockReturnValue({
                activeModal: null,
                closeModal: mockCloseModal,
                openRegister: mockOpenRegister
            });

            rerender(<LoginModal />);

            // Reopen modal
            mockUseModal.mockReturnValue({
                activeModal: 'login',
                closeModal: mockCloseModal,
                openRegister: mockOpenRegister
            });

            rerender(<LoginModal />);

            await waitFor(() => {
                expect(screen.getByText('auth.login.title')).toBeInTheDocument();
            });
        });

        it('resets error when modal closes', async () => {
            mockLogin.mockResolvedValue({ success: false, error: 'Error message' });

            const { rerender } = renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Trigger error
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.login').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'wrong' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Error message')).toBeInTheDocument();
            });

            // Close modal
            mockUseModal.mockReturnValue({
                activeModal: null,
                closeModal: mockCloseModal,
                openRegister: mockOpenRegister
            });

            rerender(<LoginModal />);

            // Reopen modal
            mockUseModal.mockReturnValue({
                activeModal: 'login',
                closeModal: mockCloseModal,
                openRegister: mockOpenRegister
            });

            rerender(<LoginModal />);

            await waitFor(() => {
                expect(screen.queryByText('Error message')).not.toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('renders modal with role dialog', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toHaveAttribute('role', 'dialog');
            });
        });

        it('renders form with proper labels', async () => {
            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
                expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
            });
        });

        it('renders OTP input with sr-only label', async () => {
            mockSendOtp.mockResolvedValue({ success: true });

            renderLoginModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const forgotPasswordLink = screen.getByText('Forgot password?');
            fireEvent.click(forgotPasswordLink);

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getAllByPlaceholderText('hello@example.com')[0];
            const submitButton = screen.getByText('Send Code').closest('button');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByLabelText('One Time Password')).toBeInTheDocument();
            });
        });
    });
});
