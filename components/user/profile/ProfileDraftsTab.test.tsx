import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProfileDraftsTab } from './ProfileDraftsTab';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('lucide-react', () => ({
    Home: () => <div data-testid="home-icon" />,
    MapPin: () => <div data-testid="mappin-icon" />,
    Car: () => <div data-testid="car-icon" />,
    Briefcase: () => <div data-testid="briefcase-icon" />,
    FileText: () => <div data-testid="filetext-icon" />,
    Trash2: () => <div data-testid="trash-icon" />,
    Edit3: () => <div data-testid="edit-icon" />,
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual as any, useNavigate: () => mockNavigate };
});

const renderTab = () =>
    render(<BrowserRouter><ProfileDraftsTab /></BrowserRouter>);

describe('ProfileDraftsTab', () => {
    let store: Record<string, string> = {};

    beforeEach(() => {
        store = {};
        mockNavigate.mockClear();
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value; });
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete store[key]; });
        vi.spyOn(Storage.prototype, 'key').mockImplementation((index) => Object.keys(store)[index] || null);
        Object.defineProperty(Storage.prototype, 'length', {
            configurable: true,
            get: () => Object.keys(store).length,
        });
    });

    it('renders heading and shows empty state when no drafts', () => {
        renderTab();
        expect(screen.getByText('Unsaved Drafts')).toBeInTheDocument();
        expect(screen.getByText('No drafts found')).toBeInTheDocument();
    });

    it('lists drafts from localStorage correctly', () => {
        store['draft_directory_listing'] = JSON.stringify({
            name: 'Seaside Cafe',
            updatedAt: new Date().toISOString()
        });
        store['draft_property_listing'] = JSON.stringify({
            title: 'Indie Villa',
            updatedAt: new Date().toISOString()
        });
        store['draft_service_listing'] = JSON.stringify({
            formData: { title: 'Limo Service' },
            updatedAt: new Date().toISOString()
        });
        store['draft_admin_directory_listing_123'] = JSON.stringify({
            formData: { name: 'Dentist Pro' },
            updatedAt: new Date().toISOString()
        });

        renderTab();

        expect(screen.getByText('Seaside Cafe')).toBeInTheDocument();
        expect(screen.getByText('Indie Villa')).toBeInTheDocument();
        expect(screen.getByText('Limo Service')).toBeInTheDocument();
        expect(screen.getByText('Dentist Pro')).toBeInTheDocument();
    });

    it('navigates to resume editing when Resume button is clicked', () => {
        store['draft_property_listing'] = JSON.stringify({
            title: 'Indie Villa',
            updatedAt: new Date().toISOString()
        });

        renderTab();

        const resumeBtn = screen.getByText('Resume');
        fireEvent.click(resumeBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/list-property');
    });

    it('discards draft when Discard icon is clicked', () => {
        store['draft_property_listing'] = JSON.stringify({
            title: 'Indie Villa',
            updatedAt: new Date().toISOString()
        });

        vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderTab();

        const discardBtn = screen.getByTitle('Discard draft');
        fireEvent.click(discardBtn);

        expect(store['draft_property_listing']).toBeUndefined();
        expect(screen.getByText('No drafts found')).toBeInTheDocument();
    });
});
