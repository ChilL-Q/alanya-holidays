import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DirectoryAdminPage } from './DirectoryAdminPage';
import { db } from '../../api-services';

// Mock the API and Router
vi.mock('../../api-services', () => ({
    db: {
        getDirectoryListings: vi.fn()
    }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockNavigate
    };
});

const mockListings = [
    { id: '1', name: 'Test Medical', category_id: 'medical', location: 'Alanya Center', is_featured: false, is_verified: true },
    { id: '2', name: 'Alanya Resort', category_id: 'accommodations', location: 'Mahmutlar', is_featured: true, is_verified: false }
];

describe('DirectoryAdminPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (db.getDirectoryListings as any).mockResolvedValue(mockListings);
    });

    it('renders the admin page and loads listings', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        expect(screen.getByText('Loading directory...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading directory...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Test Medical')).toBeInTheDocument();
        expect(screen.getByText('Alanya Resort')).toBeInTheDocument();
    });

    it('filters listings by search query', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Medical')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search directory...');
        fireEvent.change(searchInput, { target: { value: 'Resort' } });

        expect(screen.queryByText('Test Medical')).not.toBeInTheDocument();
        expect(screen.getByText('Alanya Resort')).toBeInTheDocument();
    });

    it('navigates to add new listing', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        const addBtn = screen.getByText('Add Listing');
        fireEvent.click(addBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/admin/directory/new');
    });
});
