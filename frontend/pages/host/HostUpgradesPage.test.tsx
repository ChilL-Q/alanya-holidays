import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HostUpgradesPage } from './HostUpgradesPage';
import { directoryService } from '../../api-services';

vi.mock('react-hot-toast', () => ({
    toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
    default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../api-services', () => ({
    directoryService: {
        getMyDirectoryListings: vi.fn(),
        getListingAddons: vi.fn(),
        createAddonCheckout: vi.fn(),
    }
}));

const listing = { id: '11111111-1111-1111-1111-111111111111', name: 'Sunset Villa' };

const renderPage = () => render(<MemoryRouter><HostUpgradesPage /></MemoryRouter>);

describe('HostUpgradesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (directoryService.getMyDirectoryListings as any).mockResolvedValue([listing]);
        (directoryService.getListingAddons as any).mockResolvedValue([]);
    });

    it('renders the add-on catalog for the owner listing', async () => {
        renderPage();
        expect(await screen.findByText('Instant Booking')).toBeInTheDocument();
        expect(screen.getByText('Verified Badge')).toBeInTheDocument();
        expect(screen.getByText('Seasonal Placement')).toBeInTheDocument();
        expect(screen.getByText('Sponsored Article')).toBeInTheDocument();
        expect(screen.getByText('AI Translation & Localization')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Sunset Villa' })).toBeInTheDocument();
    });

    it('shows an empty state when the host has no listings', async () => {
        (directoryService.getMyDirectoryListings as any).mockResolvedValue([]);
        renderPage();
        expect(await screen.findByText(/don't have any directory listings/i)).toBeInTheDocument();
    });

    it('marks an add-on as Active when an active row exists', async () => {
        (directoryService.getListingAddons as any).mockResolvedValue([
            { id: 'a1', listing_id: listing.id, addon_type: 'verified_badge', status: 'active' },
        ]);
        renderPage();
        await waitFor(() => expect(screen.getAllByText('Active').length).toBeGreaterThan(0));
    });
});
