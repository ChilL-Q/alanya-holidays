import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    RATES as FALLBACK_RATES,
    convertPrice as convertPriceUtil,
    formatPrice as formatPriceUtil,
    type Currency
} from '../utils/currency';
import { qk } from '../lib/queryKeys';

export type { Currency };

const RATES_CACHE_KEY = 'currency_rates_cache';
const RATES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RatesCache {
    rates: Record<Currency, number>;
    fetchedAt: number;
}

function readCacheObject(): RatesCache | null {
    try {
        const raw = localStorage.getItem(RATES_CACHE_KEY);
        return raw ? (JSON.parse(raw) as RatesCache) : null;
    } catch {
        return null;
    }
}

function loadCachedRates(): Record<Currency, number> | null {
    const cache = readCacheObject();
    if (!cache) return null;
    if (Date.now() - cache.fetchedAt > RATES_CACHE_TTL_MS) return null;
    return cache.rates;
}

function getCachedAt(): number {
    return readCacheObject()?.fetchedAt ?? 0;
}

async function fetchLiveRates(): Promise<Record<Currency, number>> {
    // Skip live fetch on localhost (dev) — Edge Function CORS issues during development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return FALLBACK_RATES;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(`${supabaseUrl}/functions/v1/currency-rates`, {
        headers: { apikey: supabaseKey },
    });
    if (!res.ok) throw new Error('Failed to fetch rates');
    const rates: Record<Currency, number> = await res.json();
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

    const { data: rates = FALLBACK_RATES } = useQuery({
        queryKey: qk.currency.rates(),
        queryFn: fetchLiveRates,
        initialData: () => loadCachedRates() ?? FALLBACK_RATES,
        initialDataUpdatedAt: getCachedAt(),
        staleTime: RATES_CACHE_TTL_MS,
        gcTime: 48 * 60 * 60_000,
        retry: 1,
    });

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

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
