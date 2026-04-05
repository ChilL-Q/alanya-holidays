import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    RATES,
    convertPrice as convertPriceUtil,
    formatPrice as formatPriceUtil,
    type Currency
} from '../utils/currency';

export type { Currency };

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    convertPrice: (amount: number, fromCurrency: Currency) => number;
    formatPrice: (amount: number, currency?: Currency) => string;
    rates: Record<Currency, number>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<Currency>(() => {
        const saved = localStorage.getItem('currency');
        return (saved as Currency) || 'EUR';
    });

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    const convertPrice = useCallback((amount: number, fromCurrency: Currency): number => {
        return convertPriceUtil(amount, fromCurrency, currency);
    }, [currency]);

    const formatPrice = useCallback((amount: number, targetCurrency?: Currency): string => {
        return formatPriceUtil(amount, targetCurrency || currency);
    }, [currency]);

    const value = useMemo(() => ({
        currency, setCurrency, convertPrice, formatPrice, rates: RATES
    }), [currency, convertPrice, formatPrice]);

    return (
        <CurrencyContext.Provider value={value}>
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
