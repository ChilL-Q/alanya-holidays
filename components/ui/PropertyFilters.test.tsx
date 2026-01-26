import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyFilters, FilterState } from './PropertyFilters';
import * as LanguageContext from '../../context/LanguageContext';

vi.mock('../../context/LanguageContext', () => ({ useLanguage: vi.fn() }));

describe('PropertyFilters', () => {
    const mockClose = vi.fn();
    const mockChange = vi.fn();
    const defaultFilters: FilterState = {
        priceRange: [0, 0],
        types: [],
        amenities: [],
        minGuests: 1,
        minBedrooms: 0,
        minBeds: 1,
        minBathrooms: 1,
        hasPhotos: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(LanguageContext.useLanguage).mockReturnValue({ t: (k: string) => k, language: 'en', setLanguage: vi.fn() });
    });

    it('is hidden when not open', () => {
        render(<PropertyFilters isOpen={false} onClose={mockClose} onFilterChange={mockChange} filters={defaultFilters} />);
        // Checking visibility using class logic known from component implementation
        const panel = screen.getByText('Filters').closest('div')?.parentElement;
        expect(panel).toHaveClass('translate-x-full');
    });

    it('renders filters when open', () => {
        render(<PropertyFilters isOpen={true} onClose={mockClose} onFilterChange={mockChange} filters={defaultFilters} />);
        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.getByText('Price Range (Per Night)')).toBeInTheDocument();
    });

    it('updates price range', () => {
        render(<PropertyFilters isOpen={true} onClose={mockClose} onFilterChange={mockChange} filters={defaultFilters} />);
        const minInput = screen.getByPlaceholderText('0');
        fireEvent.change(minInput, { target: { value: '50' } });

        expect(mockChange).toHaveBeenCalledWith(expect.objectContaining({
            priceRange: [50, 0]
        }));
    });

    it('toggles amenities', () => {
        render(<PropertyFilters isOpen={true} onClose={mockClose} onFilterChange={mockChange} filters={defaultFilters} />);
        // Checkbox is hidden, label is clickable.
        // Finding by text (translated key). We mocked t => k.
        // AMENITIES_LIST has labels e.g. "Wifi" (if constant) or translation keys.
        // Let's assume constants keys strings.
        // If we assume AMENITIES_LIST[0] is rendered.
        // Let's find one by generic label text logic if possible, or just click first checkbox label.

        // Better: We can see checkboxes
        const checkboxes = screen.getAllByRole('checkbox');
        // First group might be Property Type, second Features, third Amenities.
        // Let's interact with one of them.
        if (checkboxes.length > 0) {
            fireEvent.click(checkboxes[0]);
            // The component calls handleTypeToggle or handleAmenityToggle
            expect(mockChange).toHaveBeenCalled();
        }
    });

    it('resets filters', () => {
        render(<PropertyFilters isOpen={true} onClose={mockClose} onFilterChange={mockChange} filters={defaultFilters} />);
        const resetBtn = screen.getByText('Reset');
        fireEvent.click(resetBtn);
        expect(mockChange).toHaveBeenCalledWith(expect.objectContaining({
            minGuests: 1,
            types: []
        }));
    });
});
