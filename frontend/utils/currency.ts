
export type Currency = 'USD' | 'EUR' | 'TRY';

// Fallback rates used when live fetch fails or cache is empty
export const RATES: Record<Currency, number> = {
    EUR: 1,
    USD: 1.09,
    TRY: 38.5,
};

export const SYMBOLS: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    TRY: '₺'
};

export const convertPrice = (
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    rates: Record<Currency, number> = RATES
): number => {
    if (fromCurrency === toCurrency) return amount;
    const amountInEur = amount / rates[fromCurrency];
    return amountInEur * rates[toCurrency];
};

export const formatPrice = (amount: number, currency: Currency): string => {
    const val = Math.round(amount).toLocaleString('en-US'); // Keeping en-US format
    return `${SYMBOLS[currency]}${val}`;
};
