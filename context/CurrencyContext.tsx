import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR' | 'TRY';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    convertPrice: (amount: number, fromCurrency: Currency) => number;
    formatPrice: (amount: number, currency?: Currency) => string;
    rates: Record<Currency, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Mock exchange rates relative to EUR
// In a real app, these would come from an API
const RATES: Record<Currency, number> = {
    USD: 1.09, // 1 EUR = 1.09 USD
    EUR: 1,
    TRY: 35.5 // 1 EUR = ~35.5 TRY
};

const SYMBOLS: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    TRY: '₺'
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<Currency>(() => {
        const saved = localStorage.getItem('currency');
        return (saved as Currency) || 'EUR';
    });

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    const convertPrice = (amount: number, fromCurrency: Currency): number => {
        if (fromCurrency === currency) return amount;

        // Convert to Base (EUR) first
        const amountInBase = amount / RATES[fromCurrency];

        // Convert to target currency
        return amountInBase * RATES[currency];
    };

    const formatPrice = (amount: number, targetCurrency?: Currency): string => {
        const curr = targetCurrency || currency;
        const val = Math.round(amount).toLocaleString('en-US'); // Keeping en-US format for consistency for now

        // Special formatting for different currencies if needed
        return `${SYMBOLS[curr]}${val}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice, rates: RATES }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
