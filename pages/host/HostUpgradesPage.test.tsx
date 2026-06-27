import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { HostUpgradesPage } from './HostUpgradesPage';
import { db } from '../../api-services';

vi.mock('../../api-services', () => ({
    db: {
        getMyDirectoryListings: vi.fn(),
        getListingAddons: vi.fn(),
    }
}));

const listing = { id: '11111111-1111-1111-1111-111111111111', name: 'Sunset Villa' };

describe('HostUpgradesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (db.getMyDirectoryListings as any).mockResolvedValue([listing]);
        (db.getListingAddons as any).mockResolvedValue([]);
    });

    it('renders the add-on catalog for the owner listing', async () => {
        render(<HostUpgradesPage />);
        expect(await screen.findByText('Instant Booking')).toBeInTheDocument();
        expect(screen.getByText('Verified Badge')).toBeInTheDocument();
        expect(screen.getByText('Seasonal Placement')).toBeInTheDocument();
        expect(screen.getByText('Sponsored Article')).toBeInTheDocument();
        expect(screen.getByText('AI Translation & Localization')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Sunset Villa' })).toBeInTheDocument();
    });

    it('shows an empty state when the host has no listings', async () => {
        (db.getMyDirectoryListings as any).mockResolvedValue([]);
        render(<HostUpgradesPage />);
        expect(await screen.findByText(/don't have any directory listings/i)).toBeInTheDocument();
    });

    it('marks an add-on as Active when an active row exists', async () => {
        (db.getListingAddons as any).mockResolvedValue([
            { id: 'a1', listing_id: listing.id, addon_type: 'verified_badge', status: 'active' },
        ]);
        render(<HostUpgradesPage />);
        await waitFor(() => expect(screen.getAllByText('Active').length).toBeGreaterThan(0));
    });
});
