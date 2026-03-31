import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RegisterModal } from './RegisterModal';

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
const mockRegister = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        register: mockRegister,
        verifyOtp: mockVerifyOtp
    })
}));

// Mock useSubmitShortcut
const mockUseSubmitShortcut = vi.fn();
vi.mock('../../hooks/useSubmitShortcut', () => ({
    useSubmitShortcut: (callback: any, disabled: any) => mockUseSubmitShortcut(callback, disabled)
}));

// Mock supabase
vi.mock('../../api-services/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: null, error: null })
        }
    }
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    AlertCircle: ({ className }: any) => <svg data-testid="alert-icon" className={className} />,
    Loader2: ({ className }: any) => <svg data-testid="loader-icon" className={className} />,
    ArrowLeft: ({ className }: any) => <svg data-testid="arrow-left-icon" className={className} />,
    Mail: ({ className }: any) => <svg data-testid="mail-icon" className={className} />,
    User: ({ className }: any) => <svg data-testid="user-icon" className={className} />,
    Lock: ({ className }: any) => <svg data-testid="lock-icon" className={className} />
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

import { supabase } from '../../api-services/supabase';

const mockCloseModal = vi.fn();
const mockOpenLogin = vi.fn();

describe('RegisterModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseModal.mockReturnValue({
            activeModal: 'register',
            closeModal: mockCloseModal,
            openLogin: mockOpenLogin
        });
        mockRegister.mockReset();
        mockVerifyOtp.mockReset();
        mockUseSubmitShortcut.mockReset();
        (supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>).mockClear();
    });

    const renderRegisterModal = () => {
        return render(<RegisterModal />);
    };

    describe('Modal Visibility', () => {
        it('renders modal when activeModal is "register"', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });
        });

        it('does not render modal when activeModal is not "register"', async () => {
            mockUseModal.mockReturnValue({
                activeModal: 'login',
                closeModal: mockCloseModal,
                openLogin: mockOpenLogin
            });

            renderRegisterModal();

            expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        });
    });

    describe('Registration Form Display', () => {
        it('renders registration form by default', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal-title')).toHaveTextContent('auth.register.title');
            });
            expect(screen.getByText('auth.role.buyer')).toBeInTheDocument();
            expect(screen.getByText('auth.role.seller')).toBeInTheDocument();
        });

        it('renders role selection buttons', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const buyerButton = screen.getByText('auth.role.buyer').closest('button');
            const sellerButton = screen.getByText('auth.role.seller').closest('button');

            expect(buyerButton).toBeInTheDocument();
            expect(sellerButton).toBeInTheDocument();
        });

        it('selects guest role by default', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const buyerButton = screen.getByText('auth.role.buyer').closest('button');
            expect(buyerButton).toHaveClass('border-teal-600');
        });

        it('allows selecting host role', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const sellerButton = screen.getByText('auth.role.seller').closest('button');
            fireEvent.click(sellerButton!);

            expect(sellerButton).toHaveClass('border-teal-600');
        });

        it('renders name input with user icon', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('user-icon')).toBeInTheDocument();
            });
            const nameInput = screen.getByPlaceholderText('John Doe');
            expect(nameInput).toHaveAttribute('type', 'text');
        });

        it('renders company name input when host role is selected', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const sellerButton = screen.getByText('auth.role.seller').closest('button');
            fireEvent.click(sellerButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Alanya Holidays Ltd.')).toBeInTheDocument();
            });
        });

        it('does not render company name input when guest role is selected', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            expect(screen.queryByPlaceholderText('Alanya Holidays Ltd.')).not.toBeInTheDocument();
        });

        it('renders email input with mail icon', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
            });
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            expect(emailInput).toHaveAttribute('type', 'email');
        });

        it('renders password input with lock icon', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
            });
            const passwordInput = screen.getByPlaceholderText('••••••••');
            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        it('renders login link', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByText('auth.has_account')).toBeInTheDocument();
                expect(screen.getByText('auth.submit.login')).toBeInTheDocument();
            });
        });
    });

    describe('Registration Form Functionality', () => {
        it('updates name input value', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            fireEvent.change(nameInput, { target: { value: 'John Doe' } });

            expect(nameInput).toHaveValue('John Doe');
        });

        it('updates company name input value', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const sellerButton = screen.getByText('auth.role.seller').closest('button');
            fireEvent.click(sellerButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Alanya Holidays Ltd.')).toBeInTheDocument();
            });

            const companyInput = screen.getByPlaceholderText('Alanya Holidays Ltd.');
            fireEvent.change(companyInput, { target: { value: 'Test Company' } });

            expect(companyInput).toHaveValue('Test Company');
        });

        it('updates email input value', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText('hello@example.com');
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

            expect(emailInput).toHaveValue('test@example.com');
        });

        it('updates password input value', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const passwordInput = screen.getByPlaceholderText('••••••••');
            fireEvent.change(passwordInput, { target: { value: 'password123' } });

            expect(passwordInput).toHaveValue('password123');
        });

        it('shows error when password is less than 6 characters', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: '123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
            });
        });

        it('calls register on form submit', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(mockRegister).toHaveBeenCalledWith('John Doe', 'test@example.com', 'password123', 'guest', '');
            });
        });

        it('switches to OTP mode on successful registration', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Confirm your email address')).toBeInTheDocument();
            });
        });

        it('shows error on failed registration', async () => {
            mockRegister.mockResolvedValue({ success: false, error: 'Email already exists' });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Email already exists')).toBeInTheDocument();
            });
        });

        it('shows loading state during registration', async () => {
            mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
            });
        });

        it('disables submit button during loading', async () => {
            mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(submitButton).toBeDisabled();
            });
        });

        it('navigates to login when login link is clicked', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const loginLink = screen.getByText('auth.submit.login');
            fireEvent.click(loginLink);

            expect(mockOpenLogin).toHaveBeenCalled();
        });

        it('registers with host role when selected', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const sellerButton = screen.getByText('auth.role.seller').closest('button');
            fireEvent.click(sellerButton!);

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const companyInput = screen.getByPlaceholderText('Alanya Holidays Ltd.');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.change(companyInput, { target: { value: 'Test Company' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(mockRegister).toHaveBeenCalledWith('John Doe', 'test@example.com', 'password123', 'host', 'Test Company');
            });
        });
    });

    describe('OTP Form', () => {
        it('renders OTP form after successful registration', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Confirm your email address')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });
        });

        it('shows back to registration button in OTP mode', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Back to Registration')).toBeInTheDocument();
                expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
            });
        });

        it('shows email in OTP message', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
            });
        });

        it('calls verifyOtp on OTP form submit', async () => {
            mockRegister.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Register').closest('button');

            fireEvent.change(otpInput, { target: { value: '123456' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(mockVerifyOtp).toHaveBeenCalledWith('test@example.com', '123456', 'signup');
            });
        });

        it('closes modal on successful OTP verification', async () => {
            mockRegister.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Register').closest('button');

            fireEvent.change(otpInput, { target: { value: '123456' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(mockCloseModal).toHaveBeenCalled();
            });
        });

        it('sends welcome email on successful OTP verification', async () => {
            mockRegister.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Register').closest('button');

            fireEvent.change(otpInput, { target: { value: '123456' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(supabase.functions.invoke).toHaveBeenCalledWith('send-email', expect.anything());
            });
        });

        it('shows error on failed OTP verification', async () => {
            mockRegister.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: false, error: 'Invalid code' });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Register').closest('button');

            fireEvent.change(otpInput, { target: { value: '000000' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(screen.getByText('Invalid code')).toBeInTheDocument();
            });
        });

        it('filters non-numeric characters in OTP input', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            fireEvent.change(otpInput, { target: { value: '1a2b3c4d' } });

            expect(otpInput).toHaveValue('1234');
        });

        it('disables verify button when OTP is less than 6 digits', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Register').closest('button');

            fireEvent.change(otpInput, { target: { value: '123' } });

            expect(verifyButton).toBeDisabled();
        });

        it('returns to registration mode when back button is clicked', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Confirm your email address')).toBeInTheDocument();
            });

            const backButton = screen.getByText('Back to Registration');
            fireEvent.click(backButton);

            await waitFor(() => {
                expect(screen.getByText('auth.register.title')).toBeInTheDocument();
            });
        });

        it('clears error and OTP when back button is clicked', async () => {
            mockRegister.mockResolvedValue({ success: true });
            mockVerifyOtp.mockResolvedValue({ success: false, error: 'Invalid code' });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByPlaceholderText('12345678')).toBeInTheDocument();
            });

            // Enter invalid OTP
            const otpInput = screen.getByPlaceholderText('12345678');
            const verifyButton = screen.getByText('Verify & Register').closest('button');

            fireEvent.change(otpInput, { target: { value: '000000' } });
            fireEvent.click(verifyButton!);

            await waitFor(() => {
                expect(screen.getByText('Invalid code')).toBeInTheDocument();
            });

            // Go back
            const backButton = screen.getByText('Back to Registration');
            fireEvent.click(backButton);

            await waitFor(() => {
                expect(screen.queryByText('Invalid code')).not.toBeInTheDocument();
            });
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('registers keyboard shortcut for register mode', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            expect(mockUseSubmitShortcut).toHaveBeenCalled();
        });
    });

    describe('State Reset on Close', () => {
        it('resets step to register when modal closes', async () => {
            const { rerender } = renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Switch to OTP mode
            mockRegister.mockResolvedValue({ success: true });
            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Confirm your email address')).toBeInTheDocument();
            });

            // Close and reopen modal
            mockUseModal.mockReturnValue({
                activeModal: null,
                closeModal: mockCloseModal,
                openLogin: mockOpenLogin
            });

            rerender(<RegisterModal />);

            // Reopen modal
            mockUseModal.mockReturnValue({
                activeModal: 'register',
                closeModal: mockCloseModal,
                openLogin: mockOpenLogin
            });

            rerender(<RegisterModal />);

            await waitFor(() => {
                expect(screen.getByText('auth.register.title')).toBeInTheDocument();
            });
        });

        it('resets error when modal closes', async () => {
            mockRegister.mockResolvedValue({ success: false, error: 'Error message' });

            const { rerender } = renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            // Trigger error
            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                expect(screen.getByText('Error message')).toBeInTheDocument();
            });

            // Close modal
            mockUseModal.mockReturnValue({
                activeModal: null,
                closeModal: mockCloseModal,
                openLogin: mockOpenLogin
            });

            rerender(<RegisterModal />);

            // Reopen modal
            mockUseModal.mockReturnValue({
                activeModal: 'register',
                closeModal: mockCloseModal,
                openLogin: mockOpenLogin
            });

            rerender(<RegisterModal />);

            await waitFor(() => {
                expect(screen.queryByText('Error message')).not.toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('renders modal with role dialog', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toHaveAttribute('role', 'dialog');
            });
        });

        it('renders form with proper labels', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
            });
        });

        it('renders OTP input with proper attributes', async () => {
            mockRegister.mockResolvedValue({ success: true });

            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const nameInput = screen.getByPlaceholderText('John Doe');
            const emailInput = screen.getByPlaceholderText('hello@example.com');
            const passwordInput = screen.getByPlaceholderText('••••••••');
            const submitButton = screen.getByText('auth.submit.register').closest('button');

            fireEvent.change(nameInput, { target: { value: 'John Doe' } });
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton!);

            await waitFor(() => {
                const otpInput = screen.getByPlaceholderText('12345678');
                expect(otpInput).toHaveAttribute('type', 'text');
                expect(otpInput).toHaveAttribute('maxLength', '8');
            });
        });

        it('renders role buttons with proper structure', async () => {
            renderRegisterModal();

            await waitFor(() => {
                expect(screen.getByTestId('modal')).toBeInTheDocument();
            });

            const buyerButton = screen.getByText('auth.role.buyer').closest('button');
            expect(buyerButton).toHaveAttribute('type', 'button');
        });
    });
});
