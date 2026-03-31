import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileServicesTab } from './ProfileServicesTab';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('lucide-react', () => ({
    Car: () => <div data-testid="car-icon" />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual as any, useNavigate: () => mockNavigate };
});

const renderTab = (props: any) =>
    render(<BrowserRouter><ProfileServicesTab {...props} /></BrowserRouter>);

describe('ProfileServicesTab', () => {
    it('renders heading', () => {
        renderTab({ services: [], loading: false });
        expect(screen.getByText('profile.my_services')).toBeInTheDocument();
    });

    it('shows empty state when no services', () => {
        renderTab({ services: [], loading: false });
        expect(screen.getByText('profile.no_services')).toBeInTheDocument();
    });

    it('shows loading skeletons when loading', () => {
        const { container } = renderTab({ services: [], loading: true });
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders service cards when services provided', () => {
        const services = [
            { id: '1', title: 'Test Car', type: 'car', price: 50, images: [] },
            { id: '2', title: 'City Tour', type: 'tour', price: 100, images: [] },
        ];
        renderTab({ services, loading: false });
        expect(screen.getByText('Test Car')).toBeInTheDocument();
        expect(screen.getByText('City Tour')).toBeInTheDocument();
    });

    it('navigates to /add-service on button click', () => {
        renderTab({ services: [], loading: false });
        // The add button is in the header; use getAllByText and pick the button one
        const addBtns = screen.getAllByText('profile.add_service');
        const addBtn = addBtns.find(el => el.closest('button'));
        fireEvent.click(addBtn!);
        expect(mockNavigate).toHaveBeenCalledWith('/add-service');
    });

    it('shows service price', () => {
        const services = [{ id: '1', title: 'My Service', type: 'car', price: 75, images: [] }];
        renderTab({ services, loading: false });
        expect(screen.getByText('€75')).toBeInTheDocument();
    });

    it('shows service image when available', () => {
        const services = [{ id: '1', title: 'Car', type: 'car', price: 50, images: ['http://img.jpg'] }];
        renderTab({ services, loading: false });
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'http://img.jpg');
    });
});
