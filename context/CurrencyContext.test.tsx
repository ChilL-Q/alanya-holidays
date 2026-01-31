import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from './CurrencyContext';

// Mock utils/currency to have predictable rates for testing
vi.mock('../utils/currency', async () => {
    const actual = await vi.importActual('../utils/currency');
    return {
        ...actual,
        RATES: { EUR: 1, USD: 1.1, TRY: 30 },
        // Keep actual implementation of convert/format or mock them?
        // Let's keep actual to test the wiring, but with fixed rates.
        // If imports are live bindings, this might be tricky.
        // Let's mock the functions to ensure Context calls them correctly.
        convertPrice: vi.fn((amount, from, to) => {
            if (from === to) return amount;
            if (from === 'EUR' && to === 'USD') return Math.round(amount * 1.1); // Avoid float issues
            return amount;
        }),
        formatPrice: vi.fn((amount, currency) => {
            return `${amount} ${currency}`;
        })
    };
});

import { convertPrice, formatPrice } from '../utils/currency';

const TestComponent = () => {
    const { currency, setCurrency, convertPrice: ctxConvert, formatPrice: ctxFormat } = useCurrency();
    return (
        <div>
            <span data-testid="curr">{currency}</span>
            <button onClick={() => setCurrency('USD')}>Set USD</button>
            <span data-testid="converted">{ctxConvert(100, 'EUR')}</span>
            <span data-testid="formatted">{ctxFormat(100)}</span>
        </div>
    );
};

describe('CurrencyContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('provides default currency EUR', () => {
        render(
            <CurrencyProvider>
                <TestComponent />
            </CurrencyProvider>
        );
        expect(screen.getByTestId('curr').textContent).toBe('EUR');
    });

    it('loads currency from localStorage', () => {
        localStorage.setItem('currency', 'TRY');
        render(
            <CurrencyProvider>
                <TestComponent />
            </CurrencyProvider>
        );
        expect(screen.getByTestId('curr').textContent).toBe('TRY');
    });

    it('updates currency and saves to localStorage', () => {
        render(
            <CurrencyProvider>
                <TestComponent />
            </CurrencyProvider>
        );

        const button = screen.getByText('Set USD');
        act(() => {
            button.click();
        });

        expect(screen.getByTestId('curr').textContent).toBe('USD');
        expect(localStorage.getItem('currency')).toBe('USD');
    });

    it('calls utils.convertPrice correctly', () => {
        render(
            <CurrencyProvider>
                <TestComponent />
            </CurrencyProvider>
        );

        // Initial currency is EUR. Convert 100 EUR to EUR.
        expect(screen.getByTestId('converted').textContent).toBe('100');
        expect(convertPrice).toHaveBeenCalledWith(100, 'EUR', 'EUR');
    });

    it('uses current currency for conversion target', () => {
        render(
            <CurrencyProvider>
                <TestComponent />
            </CurrencyProvider>
        );

        const button = screen.getByText('Set USD');
        act(() => {
            button.click();
        });

        // Now currency is USD. Convert 100 EUR to USD.
        expect(screen.getByTestId('converted').textContent).toBe('110');
        expect(convertPrice).toHaveBeenCalledWith(100, 'EUR', 'USD');
    });

    it('calls utils.formatPrice correctly', () => {
        render(
            <CurrencyProvider>
                <TestComponent />
            </CurrencyProvider>
        );

        expect(screen.getByTestId('formatted').textContent).toBe('100 EUR');
        expect(formatPrice).toHaveBeenCalledWith(100, 'EUR');
    });

    it('throws error if used outside provider', () => {
        const spy = vi.spyOn(console, 'error');
        spy.mockImplementation(() => { });
        expect(() => render(<TestComponent />)).toThrow('useCurrency must be used within a CurrencyProvider');
        spy.mockRestore();
    });
});
