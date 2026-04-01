import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HostPropertiesPage } from './HostPropertiesPage';
import { db } from '../../api-services';
import { BrowserRouter } from 'react-router-dom';

const mockUser = { id: 'host-1', full_name: 'Test Host', email: 'host@test.com', role: 'host' };
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        isAuthenticated: true
    })
}));

vi.mock('../../api-services', () => ({
    db: {
        getPropertiesByHost: vi.fn(),
        deleteProperty: vi.fn()
    }
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (price: number) => price,
        formatPrice: (price: number) => `€${price}`
    })
}));

describe('HostPropertiesPage', () => {
    const mockProperties = [
        {
            id: 'prop-1',
            title: 'Beach Villa',
            location: 'Alanya, Turkey',
            status: 'approved',
            price_per_night: 150,
            type: 'Villa',
            rating: 4.8,
            images: ['https://example.com/prop1.jpg']
        },
        {
            id: 'prop-2',
            title: 'Mountain Cabin',
            location: 'Antalya, Turkey',
            status: 'pending',
            price_per_night: 100,
            type: 'Cabin',
            rating: 4.5,
            images: ['https://example.com/prop2.jpg']
        },
        {
            id: 'prop-3',
            title: 'City Apartment',
            location: 'Istanbul, Turkey',
            status: 'rejected',
            price_per_night: 80,
            type: 'Apartment',
            rating: 4.2,
            images: []
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
        (db.getPropertiesByHost as any).mockResolvedValue(mockProperties);
    });

    it('renders properties page with heading', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('My Listings')).toBeInTheDocument();
        expect(screen.getByText('Manage your properties and availability')).toBeInTheDocument();
    });

    it('fetches and displays properties on mount', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(db.getPropertiesByHost).toHaveBeenCalledWith('host-1');
        });

        expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        expect(screen.getByText('Mountain Cabin')).toBeInTheDocument();
        expect(screen.getByText('City Apartment')).toBeInTheDocument();
    });

    it('shows loading state while fetching properties', async () => {
        (db.getPropertiesByHost as any).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getAllByRole('row')).toHaveLength(4);
    });

    it('displays property images', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images.length).toBeGreaterThan(0);
        });
    });

    it('shows property status badges with correct colors', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const publishedBadges = screen.getAllByText('Published');
            expect(publishedBadges.length).toBeGreaterThan(0);
        });
        await waitFor(() => {
            const pendingBadges = screen.getAllByText('Pending');
            expect(pendingBadges.length).toBeGreaterThan(0);
        });
        await waitFor(() => {
            const rejectedBadges = screen.getAllByText('Rejected');
            expect(rejectedBadges.length).toBeGreaterThan(0);
        });
    });

    it('displays property prices in correct currency format', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('€150')).toBeInTheDocument();
            expect(screen.getByText('€100')).toBeInTheDocument();
            expect(screen.getByText('€80')).toBeInTheDocument();
        });
    });

    it('shows property ratings with star icon', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('4.8')).toBeInTheDocument();
            expect(screen.getByText('4.5')).toBeInTheDocument();
            expect(screen.getByText('4.2')).toBeInTheDocument();
        });
    });

    it('allows filtering by status', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        });

        const statusSelect = screen.getByRole('combobox');
        await act(async () => {
            fireEvent.change(statusSelect, { target: { value: 'approved' } });
        });

        expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        expect(screen.queryByText('Mountain Cabin')).not.toBeInTheDocument();
        expect(screen.queryByText('City Apartment')).not.toBeInTheDocument();
    });

    it('allows searching by property title', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search properties...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Beach' } });
        });

        expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        expect(screen.queryByText('Mountain Cabin')).not.toBeInTheDocument();
        expect(screen.queryByText('City Apartment')).not.toBeInTheDocument();
    });

    it('allows searching by location', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search properties...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Antalya' } });
        });

        expect(screen.getByText('Mountain Cabin')).toBeInTheDocument();
        expect(screen.queryByText('Beach Villa')).not.toBeInTheDocument();
    });

    it('navigates to add new listing page when button clicked', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        const addButton = screen.getByText('Add New Listing');
        fireEvent.click(addButton);

        expect(mockNavigate).toHaveBeenCalledWith('/list-property');
    });

    it('shows view action for each property', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const viewButtons = screen.getAllByTitle('View');
            expect(viewButtons.length).toBe(3);
        });
    });

    it('shows edit action for each property', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const editButtons = screen.getAllByTitle('Edit');
            expect(editButtons.length).toBe(3);
        });
    });

    it('shows delete action for each property', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const deleteButtons = screen.getAllByTitle('Delete');
            expect(deleteButtons.length).toBe(3);
        });
    });

    it('confirms before deleting a property', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => false);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const deleteButtons = screen.getAllByTitle('Delete');
            fireEvent.click(deleteButtons[0]);
        });

        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this listing? This cannot be undone.');
        confirmSpy.mockRestore();
    });

    it('deletes property when confirmed', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const deleteButtons = screen.getAllByTitle('Delete');
            fireEvent.click(deleteButtons[0]);
        });

        await waitFor(() => {
            expect(db.deleteProperty).toHaveBeenCalledWith('prop-1');
        });

        confirmSpy.mockRestore();
    });

    it('removes deleted property from the list', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);
        (db.deleteProperty as any).mockResolvedValue(undefined);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const deleteButtons = screen.getAllByTitle('Delete');
            fireEvent.click(deleteButtons[0]);
        });

        await waitFor(() => {
            expect(screen.queryByText('Beach Villa')).not.toBeInTheDocument();
        });

        confirmSpy.mockRestore();
    });

    it('shows error alert when delete fails', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        const alertSpy = vi.spyOn(window, 'alert');
        confirmSpy.mockImplementation(() => true);
        (db.deleteProperty as any).mockRejectedValue(new Error('Delete failed'));

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const deleteButtons = screen.getAllByTitle('Delete');
            fireEvent.click(deleteButtons[0]);
        });

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Failed to delete property');
        });

        confirmSpy.mockRestore();
        alertSpy.mockRestore();
    });

    it('shows empty state when no properties', async () => {
        (db.getPropertiesByHost as any).mockResolvedValue([]);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText(/No properties found/)).toBeInTheDocument();
        });

        const link = screen.getByText('Add your first listing');
        expect(link).toHaveAttribute('href', '/list-property');
    });

    it('displays property type in listing', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            // Property type is displayed with a bullet point: "• Villa"
            const typeElements = screen.getAllByText(/•\s*Villa|•\s*Cabin|•\s*Apartment/);
            expect(typeElements.length).toBeGreaterThan(0);
        });
    });

    it('shows default image when property has no images', async () => {
        const propertiesWithNoImages = [
            {
                id: 'prop-no-img',
                title: 'No Image Property',
                location: 'Somewhere',
                status: 'approved',
                price_per_night: 50,
                type: 'House',
                rating: 4.0,
                images: []
            }
        ];

        (db.getPropertiesByHost as any).mockResolvedValue(propertiesWithNoImages);

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images[0].src).toContain('unsplash.com');
        });
    });

    it('combines search and filter', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Search properties...');
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Villa' } });
        });

        const statusSelect = screen.getByRole('combobox');
        await act(async () => {
            fireEvent.change(statusSelect, { target: { value: 'approved' } });
        });

        expect(screen.getByText('Beach Villa')).toBeInTheDocument();
        expect(screen.queryByText('Mountain Cabin')).not.toBeInTheDocument();
    });

    it('displays location with map pin icon', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Alanya, Turkey')).toBeInTheDocument();
            expect(screen.getByText('Antalya, Turkey')).toBeInTheDocument();
        });
    });

    it('renders table headers correctly', async () => {
        await act(async () => {
            render(
                <BrowserRouter>
                    <HostPropertiesPage />
                </BrowserRouter>
            );
        });

        expect(screen.getByText('Property')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Price/Night')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
    });
});
