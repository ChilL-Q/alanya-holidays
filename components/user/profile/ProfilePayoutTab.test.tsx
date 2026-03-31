import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePayoutTab } from './ProfilePayoutTab';

vi.mock('../../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('lucide-react', () => ({
    Banknote: () => <div data-testid="banknote-icon" />,
    Wallet: () => <div data-testid="wallet-icon" />,
    Save: () => <div data-testid="save-icon" />,
}));

const defaultProps = {
    payoutForm: { iban: '', bankName: '', bankAccountHolderName: '', cryptoWallet: '' },
    setPayoutForm: vi.fn(),
    savingPayout: false,
    handleUpdatePayout: vi.fn(),
};

describe('ProfilePayoutTab', () => {
    it('renders payout details section', () => {
        render(<ProfilePayoutTab {...defaultProps} />);
        expect(screen.getByText('profile.payout_details')).toBeInTheDocument();
    });

    it('renders bank transfer fields', () => {
        render(<ProfilePayoutTab {...defaultProps} />);
        expect(screen.getByText('IBAN')).toBeInTheDocument();
        expect(screen.getByText('Bank Name')).toBeInTheDocument();
        expect(screen.getByText('Account Holder Name')).toBeInTheDocument();
    });

    it('renders crypto wallet field', () => {
        render(<ProfilePayoutTab {...defaultProps} />);
        expect(screen.getByText('Wallet Address (TRC20 / ERC20 / BEP20)')).toBeInTheDocument();
    });

    it('displays current form values', () => {
        const props = {
            ...defaultProps,
            payoutForm: { iban: 'TR00 0000', bankName: 'Test Bank', bankAccountHolderName: 'John', cryptoWallet: '0xABC' }
        };
        render(<ProfilePayoutTab {...props} />);
        expect(screen.getByDisplayValue('TR00 0000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
    });

    it('calls setPayoutForm on IBAN input change', () => {
        const setPayoutForm = vi.fn();
        render(<ProfilePayoutTab {...defaultProps} setPayoutForm={setPayoutForm} />);
        const ibanInput = screen.getByPlaceholderText('TR00 0000 0000 0000 0000 0000 00');
        fireEvent.change(ibanInput, { target: { value: 'TR12 3456' } });
        expect(setPayoutForm).toHaveBeenCalled();
    });

    it('calls handleUpdatePayout on form submit', () => {
        const handleUpdatePayout = vi.fn();
        render(<ProfilePayoutTab {...defaultProps} handleUpdatePayout={handleUpdatePayout} />);
        const saveBtn = screen.getByText('Save Payout Details');
        fireEvent.click(saveBtn);
        expect(handleUpdatePayout).toHaveBeenCalled();
    });

    it('shows submitting state when savingPayout is true', () => {
        render(<ProfilePayoutTab {...defaultProps} savingPayout={true} />);
        expect(screen.getByText('auth.submitting')).toBeInTheDocument();
    });

    it('disables save button when savingPayout is true', () => {
        render(<ProfilePayoutTab {...defaultProps} savingPayout={true} />);
        const saveBtn = screen.getByRole('button', { name: /auth\.submitting/i });
        expect(saveBtn).toBeDisabled();
    });
});
