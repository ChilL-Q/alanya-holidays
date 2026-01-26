import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginModal } from './LoginModal';
import * as AuthContext from '../../context/AuthContext';
import * as ModalContext from '../../context/ModalContext';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../context/ModalContext', () => ({ useModal: vi.fn() }));
vi.mock('../../context/LanguageContext', () => ({ useLanguage: vi.fn() }));

describe('LoginModal', () => {
    const mockLogin = vi.fn();
    const mockCloseModal = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(LanguageContext.useLanguage).mockReturnValue({
            t: (key: string) => key,
            language: 'en',
            setLanguage: vi.fn()
        });

        vi.mocked(ModalContext.useModal).mockReturnValue({
            activeModal: 'login',
            closeModal: mockCloseModal,
            openRegister: vi.fn(),
            openLogin: vi.fn(),
            openModal: vi.fn()
        });

        vi.mocked(AuthContext.useAuth).mockReturnValue({
            login: mockLogin,
            sendOtp: vi.fn(),
            verifyOtp: vi.fn(),
            isLoading: false,
            isAuthenticated: false,
            user: null,
            register: vi.fn(),
            logout: vi.fn(),
            updateProfile: vi.fn()
        });
    });

    it('renders nothing if activeModal is not login', () => {
        vi.mocked(ModalContext.useModal).mockReturnValue({
            activeModal: null,
            closeModal: mockCloseModal,
            openRegister: vi.fn(),
            openLogin: vi.fn(),
            openModal: vi.fn()
        });

        // Since Modal component is used, usually it handles portal or conditional rendering.
        // If not open, LoginModal might render Modal with isOpen=false.
        // Let's rely on checking text not present.
        render(<LoginModal />);
        expect(screen.queryByText('auth.login.title')).not.toBeInTheDocument();
    });

    it('renders login form when open', () => {
        render(<LoginModal />);
        expect(screen.getByText('auth.login.title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
    });

    it('submits login form with correct credentials', async () => {
        mockLogin.mockResolvedValue({ success: true });

        render(<LoginModal />);

        fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

        const submitButton = screen.getByRole('button', { name: 'auth.submit.login' });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
        });

        expect(mockCloseModal).toHaveBeenCalled();
    });

    it('displays error message on failed login', async () => {
        mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });

        render(<LoginModal />);

        fireEvent.change(screen.getByPlaceholderText('hello@example.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });

        fireEvent.click(screen.getByRole('button', { name: 'auth.submit.login' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });

        expect(mockCloseModal).not.toHaveBeenCalled();
    });
});
