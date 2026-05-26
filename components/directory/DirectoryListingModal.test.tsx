import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectoryListingModal } from './DirectoryListingModal';
import { DirectoryListingDB } from '../../types/models';
import { LanguageProvider } from '../../context/LanguageContext';

const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        trackListingClick: vi.fn().mockResolvedValue(undefined),
        getListingReviews: vi.fn().mockResolvedValue({ data: [], total: 0 }),
        getUserReviewForListing: vi.fn().mockResolvedValue(null),
    }
}));

vi.mock('../../api-services', () => ({
    db: mockDb
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
    }))
}));

vi.mock('../../utils/videoEmbed', () => ({
    parseVideoEmbed: vi.fn((url: string) => {
        if (url.includes('youtube.com/watch?v=')) {
            return { embedUrl: 'https://www.youtube.com/embed/abc123', provider: 'youtube' as const, videoId: 'abc123' };
        }
        return null;
    })
}));

const baseListing: DirectoryListingDB = {
    id: 'dir-1',
    name: 'Test Clinic',
    category_id: 'medical',
    short_description: 'A clinic',
    location: 'Alanya Center',
    gallery: ['https://example.com/img.jpg'],
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
    render(<LanguageProvider>{ui}</LanguageProvider>);

describe('DirectoryListingModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hides WhatsApp button for Explorer tier', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={baseListing}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByText('Chat on WhatsApp')).not.toBeInTheDocument();
    });

    it('shows WhatsApp button for Voyager tier with whatsapp number', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'voyager' }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.getByText('Chat on WhatsApp')).toBeInTheDocument();
    });

    it('hides WhatsApp button for Voyager tier without whatsapp number', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'voyager', whatsapp: undefined }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByText('Chat on WhatsApp')).not.toBeInTheDocument();
    });

    it('shows Verified Premium badge for Signature tier', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'signature' }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.getByText('Verified Premium')).toBeInTheDocument();
    });

    it('shows Recommended badge for Voyager tier', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'voyager' }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('hides Recommended badge for Explorer tier', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={baseListing}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
        expect(screen.queryByText('Verified Premium')).not.toBeInTheDocument();
    });

    it('renders video iframe when video_url is present', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={{ ...baseListing, video_url: 'https://youtube.com/watch?v=abc123' }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        const iframe = screen.getByTitle('Listing video');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123');
    });

    it('does not render video iframe when video_url is null', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={{ ...baseListing, video_url: undefined }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByTitle('Listing video')).not.toBeInTheDocument();
    });

    it('tracks website click', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={baseListing}
                isOpen={true}
                onClose={() => {}}
            />
        );
        const websiteBtn = screen.getByText('Visit Website');
        fireEvent.click(websiteBtn);
        expect(mockDb.trackListingClick).toHaveBeenCalledWith('dir-1', 'website');
    });

    it('tracks map click', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={baseListing}
                isOpen={true}
                onClose={() => {}}
            />
        );
        const mapBtn = screen.getByText('View on Map');
        fireEvent.click(mapBtn);
        expect(mockDb.trackListingClick).toHaveBeenCalledWith('dir-1', 'map');
    });

    it('tracks whatsapp click for paid tier', () => {
        renderWithLanguage(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'voyager' }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        const whatsappBtn = screen.getByText('Chat on WhatsApp');
        fireEvent.click(whatsappBtn);
        expect(mockDb.trackListingClick).toHaveBeenCalledWith('dir-1', 'whatsapp');
    });
});
