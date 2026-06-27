import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ListingDescription } from './ListingDescription';

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({ language: 'en' }),
}));

describe('ListingDescription', () => {
    it('falls back to short_description and shows no switcher when no translations exist', () => {
        render(<ListingDescription shortDescription="A lovely cafe" />);
        expect(screen.getByText('A lovely cafe')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows the active site language and a chip per available translation', () => {
        render(
            <ListingDescription
                shortDescription="A lovely cafe"
                descriptions={{ en: 'A lovely cafe', de: 'Ein schönes Café' }}
            />,
        );
        // defaults to English (active site language)
        expect(screen.getByText('A lovely cafe')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Deutsch' })).toBeInTheDocument();
    });

    it('switches the displayed description when a language chip is clicked', () => {
        render(
            <ListingDescription
                shortDescription="A lovely cafe"
                descriptions={{ en: 'A lovely cafe', de: 'Ein schönes Café' }}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Deutsch' }));
        expect(screen.getByText('Ein schönes Café')).toBeInTheDocument();
    });
});
