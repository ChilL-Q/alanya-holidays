import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { CheckoutPaymentSection } from './CheckoutPaymentSection';
import { PAYMENT_DETAILS } from '../../data/payment';

// Mock useLanguage
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    CreditCard: ({ className }: any) => <svg data-testid="credit-card-icon" className={className} />,
    Banknote: ({ className }: any) => <svg data-testid="banknote-icon" className={className} />,
    Shield: ({ className }: any) => <svg data-testid="shield-icon" className={className} />,
    Bitcoin: ({ className }: any) => <svg data-testid="bitcoin-icon" className={className} />,
    Copy: ({ className, size }: any) => <svg data-testid="copy-icon" className={className} width={size} height={size} />,
    Check: ({ className, size }: any) => <svg data-testid="check-icon" className={className} width={size} height={size} />
}));

// Mock navigator.clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText
    }
});

describe('CheckoutPaymentSection', () => {
    const defaultProps = {
        paymentMethod: 'card' as const,
        setPaymentMethod: vi.fn(),
        total: 100,
        convertAndFormat: (amount: number) => `€${amount.toFixed(2)}`,
        onPay: vi.fn(),
        isProcessing: false,
        isDisabled: false
    };

    const renderComponent = (props = {}) => {
        return render(<CheckoutPaymentSection {...defaultProps} {...props} />);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockWriteText.mockClear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Rendering', () => {
        it('renders payment section with title', () => {
            renderComponent();

            expect(screen.getByText('checkout.payment')).toBeInTheDocument();
        });

        it('renders all payment method buttons', () => {
            renderComponent();

            expect(screen.getByText('checkout.method.card')).toBeInTheDocument();
            expect(screen.getByText('checkout.method.cash')).toBeInTheDocument();
            expect(screen.getByText('checkout.method.bank')).toBeInTheDocument();
            expect(screen.getByText('checkout.method.crypto')).toBeInTheDocument();
            expect(screen.getByText('checkout.method.swift')).toBeInTheDocument();
        });

        it('renders payment icons', () => {
            renderComponent();

            const icons = document.querySelectorAll('svg');
            expect(icons.length).toBeGreaterThan(0);
        });

        it('renders pay button', () => {
            renderComponent();

            expect(screen.getByTestId('pay-button')).toBeInTheDocument();
        });
    });

    describe('Payment Method Selection', () => {
        it('highlights selected payment method (card)', () => {
            renderComponent({ paymentMethod: 'card' });

            const cardButton = screen.getByText('checkout.method.card').closest('button');
            expect(cardButton).toHaveClass('border-teal-600');
            expect(cardButton).toHaveClass('bg-teal-50');
        });

        it('highlights selected payment method (cash)', () => {
            renderComponent({ paymentMethod: 'cash' });

            const cashButton = screen.getByText('checkout.method.cash').closest('button');
            expect(cashButton).toHaveClass('border-teal-600');
        });

        it('highlights selected payment method (bank)', () => {
            renderComponent({ paymentMethod: 'bank' });

            const bankButton = screen.getByText('checkout.method.bank').closest('button');
            expect(bankButton).toHaveClass('border-teal-600');
        });

        it('highlights selected payment method (crypto)', () => {
            renderComponent({ paymentMethod: 'crypto' });

            const cryptoButton = screen.getByText('checkout.method.crypto').closest('button');
            expect(cryptoButton).toHaveClass('border-teal-600');
        });

        it('highlights selected payment method (swift)', () => {
            renderComponent({ paymentMethod: 'swift' });

            const swiftButton = screen.getByText('checkout.method.swift').closest('button');
            expect(swiftButton).toHaveClass('border-teal-600');
        });

        it('calls setPaymentMethod when clicking card button', () => {
            const setPaymentMethod = vi.fn();
            renderComponent({ setPaymentMethod });

            const cardButton = screen.getByText('checkout.method.card').closest('button');
            fireEvent.click(cardButton!);

            expect(setPaymentMethod).toHaveBeenCalledWith('card');
        });

        it('calls setPaymentMethod when clicking cash button', () => {
            const setPaymentMethod = vi.fn();
            renderComponent({ setPaymentMethod });

            const cashButton = screen.getByText('checkout.method.cash').closest('button');
            fireEvent.click(cashButton!);

            expect(setPaymentMethod).toHaveBeenCalledWith('cash');
        });

        it('calls setPaymentMethod when clicking bank button', () => {
            const setPaymentMethod = vi.fn();
            renderComponent({ setPaymentMethod });

            const bankButton = screen.getByText('checkout.method.bank').closest('button');
            fireEvent.click(bankButton!);

            expect(setPaymentMethod).toHaveBeenCalledWith('bank');
        });

        it('calls setPaymentMethod when clicking crypto button', () => {
            const setPaymentMethod = vi.fn();
            renderComponent({ setPaymentMethod });

            const cryptoButton = screen.getByText('checkout.method.crypto').closest('button');
            fireEvent.click(cryptoButton!);

            expect(setPaymentMethod).toHaveBeenCalledWith('crypto');
        });

        it('calls setPaymentMethod when clicking swift button', () => {
            const setPaymentMethod = vi.fn();
            renderComponent({ setPaymentMethod });

            const swiftButton = screen.getByText('checkout.method.swift').closest('button');
            fireEvent.click(swiftButton!);

            expect(setPaymentMethod).toHaveBeenCalledWith('swift');
        });
    });

    describe('Payment Method Instructions', () => {
        it('shows card payment instruction', () => {
            renderComponent({ paymentMethod: 'card' });

            expect(screen.getByText('You will be redirected to Stripe for secure payment')).toBeInTheDocument();
        });

        it('shows cash payment instruction with deposit info', () => {
            renderComponent({ paymentMethod: 'cash' });

            expect(screen.getByText('20% Non-refundable Deposit Required')).toBeInTheDocument();
            expect(screen.getByText(/To secure your reservation/)).toBeInTheDocument();
        });

        it('shows bank payment instruction with details', () => {
            renderComponent({ paymentMethod: 'bank' });

            expect(screen.getByText('checkout.method.bank_desc')).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.bank.name)).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.bank.accountHolder)).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.bank.iban)).toBeInTheDocument();
        });

        it('shows crypto payment instruction with details', () => {
            renderComponent({ paymentMethod: 'crypto' });

            expect(screen.getByText('checkout.method.crypto_desc')).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.crypto.network)).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.crypto.address)).toBeInTheDocument();
        });

        it('shows swift payment instruction with details', () => {
            renderComponent({ paymentMethod: 'swift' });

            expect(screen.getByText('checkout.method.swift_desc')).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.swift.bankName)).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.swift.bic)).toBeInTheDocument();
            expect(screen.getByText(PAYMENT_DETAILS.swift.iban)).toBeInTheDocument();
        });

        it('shows copy button for bank IBAN', () => {
            renderComponent({ paymentMethod: 'bank' });

            const copyButtons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            expect(copyButtons.length).toBeGreaterThan(0);
        });

        it('shows copy button for crypto address', () => {
            renderComponent({ paymentMethod: 'crypto' });

            const copyButtons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            expect(copyButtons.length).toBeGreaterThan(0);
        });

        it('shows copy button for swift BIC', () => {
            renderComponent({ paymentMethod: 'swift' });

            const copyButtons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            expect(copyButtons.length).toBeGreaterThan(0);
        });
    });

    describe('Copy to Clipboard', () => {
        it('copies bank IBAN to clipboard and shows feedback', async () => {
            mockWriteText.mockResolvedValue(undefined);
            renderComponent({ paymentMethod: 'bank' });

            const copyButtons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            fireEvent.click(copyButtons[0]);

            expect(mockWriteText).toHaveBeenCalledWith(PAYMENT_DETAILS.bank.iban);
            expect(screen.getByText('Copied!')).toBeInTheDocument();
            expect(screen.getByTestId('check-icon')).toBeInTheDocument();

            // Feedback should disappear after 2 seconds
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
        });

        it('copies crypto address to clipboard', async () => {
            mockWriteText.mockResolvedValue(undefined);
            renderComponent({ paymentMethod: 'crypto' });

            const copyButtons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            fireEvent.click(copyButtons[0]);

            expect(mockWriteText).toHaveBeenCalledWith(PAYMENT_DETAILS.crypto.address);
            expect(screen.getByText('Copied!')).toBeInTheDocument();
        });

        it('copies swift BIC to clipboard', async () => {
            mockWriteText.mockResolvedValue(undefined);
            renderComponent({ paymentMethod: 'swift' });

            const copyButtons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            fireEvent.click(copyButtons[0]);

            expect(mockWriteText).toHaveBeenCalledWith(PAYMENT_DETAILS.swift.bic);
            expect(screen.getByText('Copied!')).toBeInTheDocument();
        });

        it('copies swift IBAN to clipboard', async () => {
            mockWriteText.mockResolvedValue(undefined);
            renderComponent({ paymentMethod: 'swift' });

            const copyButtons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            fireEvent.click(copyButtons[1]);

            expect(mockWriteText).toHaveBeenCalledWith(PAYMENT_DETAILS.swift.iban);
            expect(screen.getByText('Copied!')).toBeInTheDocument();
        });
    });

    describe('Pay Button', () => {
        it('calls onPay when clicked', () => {
            const onPay = vi.fn();
            renderComponent({ onPay });

            const payButton = screen.getByTestId('pay-button');
            fireEvent.click(payButton);

            expect(onPay).toHaveBeenCalled();
        });

        it('shows total amount for card payment', () => {
            renderComponent({ paymentMethod: 'card', total: 100 });

            expect(screen.getByText('checkout.pay €100.00')).toBeInTheDocument();
        });

        it('shows deposit amount for cash payment', () => {
            renderComponent({ paymentMethod: 'cash', total: 100 });

            expect(screen.getByText('Pay Deposit €20.00')).toBeInTheDocument();
        });

        it('shows total amount for bank payment', () => {
            renderComponent({ paymentMethod: 'bank', total: 100 });

            expect(screen.getByText('checkout.pay €100.00')).toBeInTheDocument();
        });

        it('shows total amount for crypto payment', () => {
            renderComponent({ paymentMethod: 'crypto', total: 100 });

            expect(screen.getByText('checkout.pay €100.00')).toBeInTheDocument();
        });

        it('shows total amount for swift payment', () => {
            renderComponent({ paymentMethod: 'swift', total: 100 });

            expect(screen.getByText('checkout.pay €100.00')).toBeInTheDocument();
        });

        it('is disabled when isDisabled is true', () => {
            renderComponent({ isDisabled: true });

            const payButton = screen.getByTestId('pay-button');
            expect(payButton).toBeDisabled();
            expect(payButton).toHaveClass('disabled:cursor-not-allowed');
        });

        it('is disabled when isProcessing is true', () => {
            renderComponent({ isProcessing: true });

            const payButton = screen.getByTestId('pay-button');
            expect(payButton).toBeDisabled();
        });

        it('shows processing text when isProcessing is true', () => {
            renderComponent({ isProcessing: true });

            expect(screen.getByText('Processing...')).toBeInTheDocument();
        });

        it('has correct styling classes', () => {
            renderComponent();

            const payButton = screen.getByTestId('pay-button');
            expect(payButton).toHaveClass('bg-teal-700');
            expect(payButton).toHaveClass('dark:bg-cyan-600');
            expect(payButton).toHaveClass('font-bold');
        });
    });

    describe('Styling', () => {
        it('has correct container classes', () => {
            renderComponent();

            const container = screen.getByText('checkout.payment').closest('div');
            expect(container).toHaveClass('bg-white');
            expect(container).toHaveClass('dark:bg-slate-800/80');
            expect(container).toHaveClass('rounded-xl');
            expect(container).toHaveClass('p-6');
        });

        it('has correct grid layout for payment methods', () => {
            renderComponent();

            const grid = screen.getByText('checkout.payment').closest('div')?.querySelector('.grid');
            expect(grid).toBeInTheDocument();
            expect(grid).toHaveClass('grid-cols-2');
            expect(grid).toHaveClass('gap-4');
        });

        it('swift button has col-span-2 class', () => {
            renderComponent();

            const swiftButton = screen.getByText('checkout.method.swift').closest('button');
            expect(swiftButton).toHaveClass('col-span-2');
        });
    });

    describe('Dark Mode', () => {
        it('renders with dark mode classes', () => {
            renderComponent();

            const container = screen.getByText('checkout.payment').closest('div');
            expect(container).toHaveClass('dark:bg-slate-800/80');
        });

        it('renders instruction panels with dark mode classes', () => {
            renderComponent({ paymentMethod: 'bank' });

            const panel = document.querySelector('.bg-teal-50');
            expect(panel).toBeInTheDocument();
            expect(panel).toHaveClass('dark:bg-slate-800/50');
        });
    });

    describe('Accessibility', () => {
        it('renders payment method buttons with proper structure', () => {
            renderComponent();

            const cardButton = screen.getByText('checkout.method.card').closest('button');
            expect(cardButton).toBeInTheDocument();
        });

        it('renders pay button with proper structure', () => {
            renderComponent();

            const payButton = screen.getByTestId('pay-button');
            expect(payButton).toBeInTheDocument();
        });

        it('renders copy icons with proper size', () => {
            renderComponent({ paymentMethod: 'bank' });

            const copyIcons = screen.getAllByRole('button').filter(b => b.title === 'checkout.copy');
            // Check size of the first svg child of the button
            const firstSvg = copyIcons[0].querySelector('svg');
            expect(firstSvg).toHaveAttribute('width', '12');
            expect(firstSvg).toHaveAttribute('height', '12');
        });
    });

    describe('Animation', () => {
        it('renders instruction panels with animation classes', () => {
            renderComponent({ paymentMethod: 'card' });

            const panel = screen.getByText('You will be redirected to Stripe for secure payment').closest('div');
            expect(panel).toHaveClass('animate-in');
            expect(panel).toHaveClass('fade-in');
            expect(panel).toHaveClass('slide-in-from-top-2');
        });

        it('renders bank instruction with animation classes', () => {
            renderComponent({ paymentMethod: 'bank' });

            const panel = screen.getByText('checkout.method.bank_desc').closest('div');
            expect(panel).toHaveClass('animate-in');
            expect(panel).toHaveClass('fade-in');
        });

        it('renders crypto instruction with animation classes', () => {
            renderComponent({ paymentMethod: 'crypto' });

            const panel = screen.getByText('checkout.method.crypto_desc').closest('div');
            expect(panel).toHaveClass('animate-in');
        });

        it('renders swift instruction with animation classes', () => {
            renderComponent({ paymentMethod: 'swift' });

            const panel = screen.getByText('checkout.method.swift_desc').closest('div');
            expect(panel).toHaveClass('animate-in');
        });
    });
});
