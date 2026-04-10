import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DirectoryAdminPage } from './DirectoryAdminPage';
import { db } from '../../api-services';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock('../../api-services', () => ({
    db: {
        getDirectoryListings: vi.fn(),
        deleteDirectoryListing: vi.fn(),
        createDirectoryListing: vi.fn()
    }
}));

vi.mock('react-hot-toast', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
    default: { error: vi.fn(), success: vi.fn() },
}));

// Mock data
const mockListings = [
    { id: '1', name: 'Test Medical', category_id: 'medical', location: 'Alanya Center', is_featured: false, is_verified: true },
    { id: '2', name: 'Alanya Resort', category_id: 'accommodations', location: 'Mahmutlar', is_featured: true, is_verified: false }
];

describe('DirectoryAdminPage', () => {
    const mockPagination = { page: 1, limit: 100, total: 2, totalPages: 1 };

    beforeEach(() => {
        vi.clearAllMocks();
        (db.getDirectoryListings as any).mockResolvedValue({ data: mockListings, pagination: mockPagination });
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders the admin page and loads listings', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(db.getDirectoryListings).toHaveBeenCalled();
            expect(screen.getByText('Test Medical')).toBeInTheDocument();
            expect(screen.getByText('Alanya Resort')).toBeInTheDocument();
        });
    });

    it('filters listings by search query (name)', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Test Medical')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search directory...');
        fireEvent.change(searchInput, { target: { value: 'Resort' } });

        expect(screen.queryByText('Test Medical')).not.toBeInTheDocument();
        expect(screen.getByText('Alanya Resort')).toBeInTheDocument();
    });

    it('filters listings by category', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Test Medical')).toBeInTheDocument());

        const medicalBtn = screen.getByRole('button', { name: /medical/i });
        fireEvent.click(medicalBtn);

        expect(screen.getByText('Test Medical')).toBeInTheDocument();
        expect(screen.queryByText('Alanya Resort')).not.toBeInTheDocument();
    });

    it('navigates to add new listing', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Add Listing')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Add Listing'));
        expect(mockNavigate).toHaveBeenCalledWith('/admin/directory/new');
    });

    it('navigates to edit listing', async () => {
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Test Medical')).toBeInTheDocument());

        const editBtns = screen.getAllByTitle('Edit');
        fireEvent.click(editBtns[0]);

        expect(mockNavigate).toHaveBeenCalledWith('/admin/directory/1');
    });

    it('handles delete action with confirmation', async () => {
        (db.deleteDirectoryListing as any).mockResolvedValue({});
        
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Test Medical')).toBeInTheDocument());

        const deleteBtns = screen.getAllByTitle('Delete');
        fireEvent.click(deleteBtns[0]);

        expect(screen.getByText('Delete Directory Listing')).toBeInTheDocument();
        
        // Find the "Delete" button inside the footer. It has specific classes.
        const modalDeleteBtn = screen.getAllByText('Delete').find(el => el.tagName === 'BUTTON' && el.className.includes('bg-red-600'));
        if (modalDeleteBtn) fireEvent.click(modalDeleteBtn);

        await waitFor(() => {
            expect(db.deleteDirectoryListing).toHaveBeenCalledWith('1');
            expect(db.getDirectoryListings).toHaveBeenCalledTimes(2); 
        });
    });

    it('handles delete failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.deleteDirectoryListing as any).mockRejectedValue(new Error('Delete failed'));
        
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Test Medical')).toBeInTheDocument());

        fireEvent.click(screen.getAllByTitle('Delete')[0]);
        
        const modalDeleteBtn = screen.getAllByText('Delete').find(el => el.tagName === 'BUTTON' && el.className.includes('bg-red-600'));
        if (modalDeleteBtn) fireEvent.click(modalDeleteBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        const { toast } = await import('react-hot-toast');
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete listing'));
        consoleSpy.mockRestore();
    });

    it('handles mock data migration', async () => {
        (db.getDirectoryListings as any).mockResolvedValueOnce({ data: [], pagination: mockPagination }).mockResolvedValue({ data: mockListings, pagination: mockPagination });
        (db.createDirectoryListing as any).mockResolvedValue({ id: 'new' });

        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => expect(screen.getByText('Migrate Data')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Migrate Data'));

        expect(window.confirm).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(db.createDirectoryListing).toHaveBeenCalled();
        });
        const { toast } = await import('react-hot-toast');
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Successfully migrated'));
    });

    it('handles API error when loading listings', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getDirectoryListings as any).mockRejectedValue(new Error('Fetch failed'));
        
        render(
            <BrowserRouter>
                <DirectoryAdminPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        
        consoleSpy.mockRestore();
    });
});
