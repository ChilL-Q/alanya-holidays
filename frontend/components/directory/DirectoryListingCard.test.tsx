import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DirectoryListingCard } from './DirectoryListingCard';
import { DirectoryListingDB } from '../../types/models';
import { LanguageProvider } from '../../context/LanguageContext';

const { mockDirectoryService } = vi.hoisted(() => ({
    mockDirectoryService: {
        trackListingClick: vi.fn().mockResolvedValue(undefined),
        trackListingView: vi.fn().mockResolvedValue(undefined),
    }
}));

vi.mock('../../api-services', () => ({
    directoryService: mockDirectoryService
}));

const baseListing: DirectoryListingDB = {
    id: 'dir-1',
    name: 'Test Clinic',
    category_id: 'medical',
    short_description: 'A clinic',
    location: 'Alanya Center',
    gallery: [],
    is_featured: false,
    is_verified: false,
    tier: 'explorer',
    whatsapp: '+905551234567',
    website: 'https://example.com',
    google_map_url: 'https://maps.google.com',
    status: 'approved',
    owner_user_id: null,
    rejection_reason: null,
};

const renderWithLanguage = (ui: React.ReactElement) =>
    render(
        <MemoryRouter>
            <LanguageProvider>{ui}</LanguageProvider>
        </MemoryRouter>
    );

describe('DirectoryListingCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows WhatsApp button for Voyager tier', () => {
        renderWithLanguage(
            <DirectoryListingCard
                listing={{ ...baseListing, tier: 'voyager' }}
                onClick={() => {}}
                isAuthenticated={true}
            />
        );
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    });

    it('hides WhatsApp button for Explorer tier', () => {
        renderWithLanguage(
            <DirectoryListingCard
                listing={baseListing}
                onClick={() => {}}
                isAuthenticated={true}
            />
        );
        expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
    });

    it('shows Recommended badge for paid tiers', () => {
        renderWithLanguage(
            <DirectoryListingCard
                listing={{ ...baseListing, tier: 'voyager' }}
                onClick={() => {}}
                isAuthenticated={true}
            />
        );
        expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('hides Recommended badge for Explorer tier', () => {
        renderWithLanguage(
            <DirectoryListingCard
                listing={baseListing}
                onClick={() => {}}
                isAuthenticated={true}
            />
        );
        expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
    });

    it('tracks website click', () => {
        renderWithLanguage(
            <DirectoryListingCard
                listing={baseListing}
                onClick={() => {}}
                isAuthenticated={true}
            />
        );
        const websiteBtn = screen.getByText('Website');
        fireEvent.click(websiteBtn);
        expect(mockDirectoryService.trackListingClick).toHaveBeenCalledWith('dir-1', 'website');
    });

    it('tracks map click', () => {
        renderWithLanguage(
            <DirectoryListingCard
                listing={baseListing}
                onClick={() => {}}
                isAuthenticated={true}
            />
        );
        const mapBtn = screen.getByText('Map');
        fireEvent.click(mapBtn);
        expect(mockDirectoryService.trackListingClick).toHaveBeenCalledWith('dir-1', 'map');
    });
});
