import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { CarRental } from './CarRental';
import { useCars } from '../hooks/useCars';
import { MemoryRouter } from 'react-router-dom';

// Mocks
vi.mock('../hooks/useCars', () => ({
    useCars: vi.fn(),
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (p: number) => p,
        formatPrice: (p: number) => `€${p}`,
    }),
}));

describe('CarRental Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <CarRental />
            </MemoryRouter>
        );
    };

    it('renders loading state', () => {
        (useCars as any).mockReturnValue({
            carGroups: [],
            loading: true,
        });

        renderPage();

        expect(screen.getByText('Loading fleet...')).toBeInTheDocument();
    });

    it('renders empty state when no cars are available', () => {
        (useCars as any).mockReturnValue({
            carGroups: [],
            loading: false,
        });

        renderPage();

        expect(screen.getByText('No vehicles currently available.')).toBeInTheDocument();
    });

    it('renders list of cars when data is loaded', () => {
        const mockCars = [
            {
                id: 'car-1',
                title: 'Fiat Egea',
                brand: 'Fiat',
                model: 'Egea',
                image: 'fiat.jpg',
                year: '2023',
                minPrice: 40,
                count: 1,
                features: ['Automatic', 'Diesel']
            },
            {
                id: 'car-2',
                title: 'Renault Megane',
                brand: 'Renault',
                model: 'Megane',
                image: 'renault.jpg',
                year: '2022',
                minPrice: 50,
                count: 2,
                features: ['Manual', 'Gasoline']
            }
        ];

        (useCars as any).mockReturnValue({
            carGroups: mockCars,
            loading: false,
        });

        renderPage();

        expect(screen.getByText('Fiat Egea')).toBeInTheDocument();
        expect(screen.getByText('Renault Megane')).toBeInTheDocument();
        expect(screen.getByText('2 Offers')).toBeInTheDocument(); // For the Megane
        expect(screen.getByText('€40')).toBeInTheDocument();
        expect(screen.getByText('€50')).toBeInTheDocument();
    });

    it('renders hero section details', () => {
        (useCars as any).mockReturnValue({
            carGroups: [],
            loading: false,
        });

        renderPage();

        expect(screen.getByText('car.hero.title')).toBeInTheDocument();
        expect(screen.getByText('car.hero.subtitle')).toBeInTheDocument();
        expect(screen.getByText('car.features.delivery')).toBeInTheDocument();
    });
});
