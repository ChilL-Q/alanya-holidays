
export type Currency = 'USD' | 'EUR' | 'TRY';

export const RATES: Record<Currency, number> = {
    USD: 1.09, // 1 EUR = 1.09 USD
    EUR: 1,
    TRY: 35.5 // 1 EUR = ~35.5 TRY
};

export const SYMBOLS: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    TRY: '₺'
};

export const convertPrice = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return amount;

    // Convert to Base (EUR) first
    const amountInBase = amount / RATES[fromCurrency];

    // Convert to target currency
    return amountInBase * RATES[toCurrency];
};

export const formatPrice = (amount: number, currency: Currency): string => {
    const val = Math.round(amount).toLocaleString('en-US'); // Keeping en-US format
    return `${SYMBOLS[currency]}${val}`;
};
