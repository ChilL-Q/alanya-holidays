import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    RATES,
    SYMBOLS,
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

    const convertPrice = (amount: number, fromCurrency: Currency): number => {
        return convertPriceUtil(amount, fromCurrency, currency);
    };

    const formatPrice = (amount: number, targetCurrency?: Currency): string => {
        return formatPriceUtil(amount, targetCurrency || currency);
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
