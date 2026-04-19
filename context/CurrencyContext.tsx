import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    RATES as FALLBACK_RATES,
    convertPrice as convertPriceUtil,
    formatPrice as formatPriceUtil,
    type Currency
} from '../utils/currency';

export type { Currency };

const RATES_CACHE_KEY = 'currency_rates_cache';
const RATES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RatesCache {
    rates: Record<Currency, number>;
    fetchedAt: number;
}

function loadCachedRates(): Record<Currency, number> | null {
    try {
        const raw = localStorage.getItem(RATES_CACHE_KEY);
        if (!raw) return null;
        const cache: RatesCache = JSON.parse(raw);
        if (Date.now() - cache.fetchedAt > RATES_CACHE_TTL_MS) return null;
        return cache.rates;
    } catch {
        return null;
    }
}

async function fetchLiveRates(): Promise<Record<Currency, number>> {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,TRY');
    if (!res.ok) throw new Error('Failed to fetch rates');
    const json = await res.json();
    // json.rates = { USD: 1.08, TRY: 38.5 }
    const rates: Record<Currency, number> = {
        EUR: 1,
        USD: json.rates.USD,
        TRY: json.rates.TRY,
    };
    const cache: RatesCache = { rates, fetchedAt: Date.now() };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache));
    return rates;
}

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

    const [rates, setRates] = useState<Record<Currency, number>>(
        () => loadCachedRates() ?? FALLBACK_RATES
    );

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    // Fetch live rates on mount; use cache if still fresh
    useEffect(() => {
        if (loadCachedRates()) return; // cache is fresh, skip fetch
        fetchLiveRates()
            .then(setRates)
            .catch(() => {
                // Keep fallback rates silently — non-critical
            });
    }, []);

    const convertPrice = useCallback((amount: number, fromCurrency: Currency): number => {
        return convertPriceUtil(amount, fromCurrency, currency, rates);
    }, [currency, rates]);

    const formatPrice = useCallback((amount: number, targetCurrency?: Currency): string => {
        return formatPriceUtil(amount, targetCurrency || currency);
    }, [currency]);

    const value = useMemo(() => ({
        currency, setCurrency, convertPrice, formatPrice, rates
    }), [currency, convertPrice, formatPrice, rates]);

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
