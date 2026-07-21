import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertiesPage } from './PropertiesPage';
import { db } from '../../api-services';

vi.mock('../../api-services', () => ({
    db: {
        getAdminProperties: vi.fn(),
        approveProperty: vi.fn(),
        deleteProperty: vi.fn(),
        updatePropertyStatus: vi.fn()
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

const mockProperties = [
    { id: 1, title: 'Luxury Villa', location: 'Kargicak', price_per_night: 200, status: 'approved', type: 'villa' },
    { id: 2, title: 'Central Apartment', location: 'Alanya Center', price_per_night: 50, status: 'pending', type: 'apartment' }
];

const renderPage = () =>
    render(
        <BrowserRouter>
            <PropertiesPage />
        </BrowserRouter>
    );

describe('PropertiesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (db.getAdminProperties as any).mockResolvedValue({ data: mockProperties });
    });

    it('renders properties and filters them by search query', async () => {
        renderPage();

        expect(screen.getByText('Loading properties...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading properties...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
        expect(screen.getByText('Central Apartment')).toBeInTheDocument();

        // Search
        const searchInput = screen.getByPlaceholderText('Search properties...');
        fireEvent.change(searchInput, { target: { value: 'Central' } });

        expect(screen.queryByText('Luxury Villa')).not.toBeInTheDocument();
        expect(screen.getByText('Central Apartment')).toBeInTheDocument();
    });

    it('renders loading state initially', () => {
        (db.getAdminProperties as any).mockReturnValue(new Promise(() => {}));

        renderPage();

        expect(screen.getByText('Loading properties...')).toBeInTheDocument();
    });

    it('renders properties after load', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
            expect(screen.getByText('Central Apartment')).toBeInTheDocument();
        });
    });

    it('search filtering works by title', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Luxury Villa')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Search properties...'), {
            target: { value: 'Luxury' }
        });

        expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
        expect(screen.queryByText('Central Apartment')).not.toBeInTheDocument();
    });

    it('search filtering works by location', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Luxury Villa')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Search properties...'), {
            target: { value: 'Alanya Center' }
        });

        expect(screen.getByText('Central Apartment')).toBeInTheDocument();
        expect(screen.queryByText('Luxury Villa')).not.toBeInTheDocument();
    });

    it('status filter works — shows only pending properties', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Luxury Villa')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /^Pending$/i }));

        await waitFor(() => {
            expect(screen.getByText('Central Apartment')).toBeInTheDocument();
            expect(screen.queryByText('Luxury Villa')).not.toBeInTheDocument();
        });
    });

    it('status filter works — shows only approved properties', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Central Apartment')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: /^Approved$/i }));

        await waitFor(() => {
            expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
            expect(screen.queryByText('Central Apartment')).not.toBeInTheDocument();
        });
    });

    it('renders no properties message when none match filter', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Luxury Villa')).toBeInTheDocument());

        // Rejected filter — neither mock property has status 'rejected'
        fireEvent.click(screen.getByRole('button', { name: /^Rejected$/i }));

        await waitFor(() => {
            expect(screen.getByText('No properties found.')).toBeInTheDocument();
        });
    });

    it('openActionModal: opens approve confirmation modal for pending property', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Central Apartment')).toBeInTheDocument());

        // 'Approve' button only renders for pending properties (id=2, Central Apartment)
        const approveBtn = screen.getByTitle('Approve');
        fireEvent.click(approveBtn);

        await waitFor(() => {
            expect(screen.getByText('Approve Property')).toBeInTheDocument();
        });
    });

    it('openActionModal: opens delete confirmation modal', async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText('Luxury Villa')).toBeInTheDocument());

        // Delete buttons rendered for all properties — first one is Luxury Villa
        const deleteBtns = screen.getAllByTitle('Delete');
        fireEvent.click(deleteBtns[0]);

        await waitFor(() => {
            expect(screen.getByText('Delete Property')).toBeInTheDocument();
        });
    });

    it('handleConfirmAction: calls approveProperty when confirming approve', async () => {
        (db.approveProperty as any).mockResolvedValue(undefined);

        renderPage();

        await waitFor(() => expect(screen.getByText('Central Apartment')).toBeInTheDocument());

        fireEvent.click(screen.getByTitle('Approve'));

        // Wait for the modal heading to confirm it's open
        await waitFor(() => {
            expect(screen.getByText('Approve Property')).toBeInTheDocument();
        });

        // ConfirmationModal confirm button has the confirmLabel text — use getAllByRole
        // and find the one inside the modal footer (the non-toolbar Approve button)
        const approveBtns = screen.getAllByRole('button', { name: /^Approve$/i });
        // The last one is in the modal footer (toolbar Approve button is title-based, not text)
        const modalConfirmBtn = approveBtns[approveBtns.length - 1];
        fireEvent.click(modalConfirmBtn);

        await waitFor(() => {
            expect(db.approveProperty).toHaveBeenCalledWith('2');
        });
    });
});
