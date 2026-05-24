import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectoryListingModal } from './DirectoryListingModal';
import { DirectoryListingDB } from '../../types/models';

const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        trackListingClick: vi.fn().mockResolvedValue(undefined),
    }
}));

vi.mock('../../api-services', () => ({
    db: mockDb
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
};

describe('DirectoryListingModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hides WhatsApp button for Explorer tier', () => {
        render(
            <DirectoryListingModal
                listing={baseListing}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByText('Chat on WhatsApp')).not.toBeInTheDocument();
    });

    it('shows WhatsApp button for Voyager tier with whatsapp number', () => {
        render(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'voyager' }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.getByText('Chat on WhatsApp')).toBeInTheDocument();
    });

    it('hides WhatsApp button for Voyager tier without whatsapp number', () => {
        render(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'voyager', whatsapp: undefined }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByText('Chat on WhatsApp')).not.toBeInTheDocument();
    });

    it('shows Recommended badge for Signature tier', () => {
        render(
            <DirectoryListingModal
                listing={{ ...baseListing, tier: 'signature' }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('hides Recommended badge for Explorer tier', () => {
        render(
            <DirectoryListingModal
                listing={baseListing}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
    });

    it('renders video iframe when video_url is present', () => {
        render(
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
        render(
            <DirectoryListingModal
                listing={{ ...baseListing, video_url: undefined }}
                isOpen={true}
                onClose={() => {}}
            />
        );
        expect(screen.queryByTitle('Listing video')).not.toBeInTheDocument();
    });

    it('tracks website click', () => {
        render(
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
        render(
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
        render(
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
