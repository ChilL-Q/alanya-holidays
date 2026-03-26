import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditDirectoryPage } from './AdminEditDirectoryPage';

vi.mock('../../api-services', () => ({
    db: {
        getDirectoryListing: vi.fn(),
        createDirectoryListing: vi.fn(),
        updateDirectoryListing: vi.fn(),
        uploadImage: vi.fn()
    }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'new' })
    };
});

describe('AdminEditDirectoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders new listing form correctly', () => {
        render(
            <BrowserRouter>
                <AdminEditDirectoryPage />
            </BrowserRouter>
        );

        expect(screen.getByText('New Listing')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. Alanya Premium Dental')).toBeInTheDocument();
    });

    it('adds array items correctly for languages', () => {
        render(
            <BrowserRouter>
                <AdminEditDirectoryPage />
            </BrowserRouter>
        );

        const addLangBtn = screen.getByText('+ Add Language');
        fireEvent.click(addLangBtn);
        fireEvent.click(addLangBtn);

        // Should have 3 inputs (1 default + 2 added)
        const inputs = screen.getAllByPlaceholderText('e.g. English');
        expect(inputs.length).toBe(3);
    });
});
