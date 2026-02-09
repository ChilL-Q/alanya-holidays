import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServicesPage } from './ServicesPage';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../api-services';

// Mock DB
vi.mock('../services', () => ({
    db: {
        getServices: vi.fn()
    }
}));

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock Currency Context
vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (price: number) => price,
        formatPrice: (price: number) => `€${price}`
    })
}));

describe('ServicesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock
        (db.getServices as any).mockResolvedValue({
            data: [
                { id: '1', title: 'Tour A', price: 100, features: {} },
                { id: '2', title: 'Tour B', price: 200, features: {} }
            ]
        });
    });

    it('renders services page', async () => {
        render(
            <MemoryRouter>
                <ServicesPage />
            </MemoryRouter>
        );
        // It might show loading first or directly content depending on implementation
        // Check for static text
        expect(screen.getByText('services.hero.title')).toBeDefined();
    });
});
