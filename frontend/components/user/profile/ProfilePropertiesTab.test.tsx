import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePropertiesTab } from './ProfilePropertiesTab';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('lucide-react', () => ({
    Home: () => <div data-testid="home-icon" />,
    MapPin: () => <div data-testid="mappin-icon" />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual as any, useNavigate: () => mockNavigate };
});

const renderTab = (props: any) =>
    render(<BrowserRouter><ProfilePropertiesTab {...props} /></BrowserRouter>);

describe('ProfilePropertiesTab', () => {
    it('renders heading', () => {
        renderTab({ properties: [], loading: false });
        expect(screen.getByText('profile.my_properties')).toBeInTheDocument();
    });

    it('shows empty state when no properties', () => {
        renderTab({ properties: [], loading: false });
        expect(screen.getByText('profile.no_properties')).toBeInTheDocument();
    });

    it('shows loading skeletons when loading', () => {
        const { container } = renderTab({ properties: [], loading: true });
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders property cards when properties provided', () => {
        const properties = [
            { id: '1', title: 'Sea View Villa', type: 'villa', price_per_night: 200, location: 'Alanya', images: [], status: 'approved' },
        ];
        renderTab({ properties, loading: false });
        expect(screen.getByText('Sea View Villa')).toBeInTheDocument();
        expect(screen.getByText('Alanya')).toBeInTheDocument();
    });

    it('navigates to /list-property on add button click', () => {
        renderTab({ properties: [], loading: false });
        // Multiple elements with this text exist; pick the one inside a button
        const addBtns = screen.getAllByText('profile.add_property');
        const addBtn = addBtns.find(el => el.closest('button'));
        fireEvent.click(addBtn!);
        expect(mockNavigate).toHaveBeenCalledWith('/list-property');
    });

    it('shows property price per night', () => {
        const properties = [{ id: '1', title: 'Apt', type: 'apartment', price_per_night: 150, location: 'Center', images: [], status: 'approved' }];
        renderTab({ properties, loading: false });
        expect(screen.getByText('€150')).toBeInTheDocument();
    });

    it('shows approved status badge', () => {
        const properties = [{ id: '1', title: 'Apt', type: 'apartment', price_per_night: 100, location: 'Center', images: [], status: 'approved' }];
        renderTab({ properties, loading: false });
        expect(screen.getByText('approved')).toBeInTheDocument();
    });

    it('shows pending status for property without status', () => {
        const properties = [{ id: '1', title: 'Apt', type: 'apartment', price_per_night: 100, location: 'Center', images: [], status: undefined }];
        renderTab({ properties, loading: false });
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });
});
