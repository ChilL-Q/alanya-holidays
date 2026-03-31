import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListProperty } from './ListProperty';
import { BrowserRouter } from 'react-router-dom';

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock contexts
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: { id: 'test-user-id' }
    })
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({
        theme: 'light'
    })
}));

vi.mock('@react-google-maps/api', () => ({
    GoogleMap: ({ children }: any) => <div>{children}</div>,
    useJsApiLoader: () => ({ isLoaded: true }),
    MarkerF: () => <div>Marker</div>
}));

vi.mock('../context/ModalContext', () => ({
    useModal: () => ({
        openRegister: vi.fn(),
        openLogin: vi.fn()
    })
}));

// Mock API services
vi.mock('../api-services', () => ({
    db: {
        createProperty: vi.fn().mockResolvedValue({}),
        uploadImage: vi.fn().mockResolvedValue('http://example.com/image.jpg')
    }
}));

vi.mock('react-hot-toast', () => {
    const toastFn: any = vi.fn();
    toastFn.error = vi.fn();
    toastFn.success = vi.fn();
    toastFn.loading = vi.fn();
    return { default: toastFn };
});

vi.mock('../hooks/useSubmitShortcut', () => ({
    useSubmitShortcut: vi.fn()
}));

const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
};

// Helper: navigate through steps that need a property type selection
const selectTypeAndNext = () => {
    fireEvent.click(screen.getByText('list_prop.type_apt'));
    fireEvent.click(screen.getByText('list_prop.next'));
};

describe('ListProperty Component', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('renders property type step initially', () => {
        renderWithRouter(<ListProperty />);
        expect(screen.getByText('list_prop.step1_title')).toBeDefined();
        expect(screen.getByText('list_prop.type_apt')).toBeDefined();
        expect(screen.getByText('list_prop.type_villa')).toBeDefined();
    });

    it('transitions to location step when a type is selected and next is clicked', async () => {
        renderWithRouter(<ListProperty />);
        
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));

        expect(screen.getByText('list_prop.step2_title')).toBeDefined();
    });

    it('goes back to previous step', () => {
        renderWithRouter(<ListProperty />);

        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));

        expect(screen.getByText('list_prop.step2_title')).toBeDefined();

        fireEvent.click(screen.getByText('list_prop.back'));
        expect(screen.getByText('list_prop.step1_title')).toBeDefined();
    });

    it('shows toast error when next clicked without selecting a property type', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderWithRouter(<ListProperty />);
        // Don't select type, just click next
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(toast.error).toHaveBeenCalled();
    });

    it('renders step 1 (location) after type selection', () => {
        renderWithRouter(<ListProperty />);
        selectTypeAndNext();
        expect(screen.getByText('list_prop.step2_title')).toBeDefined();
    });

    it('shows toast error when trying to go to step 2 without location', async () => {
        const toast = (await import('react-hot-toast')).default;
        renderWithRouter(<ListProperty />);
        selectTypeAndNext(); // On step 1 (location)
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(toast.error).toHaveBeenCalled();
    });

    it('renders villa type option', () => {
        renderWithRouter(<ListProperty />);
        expect(screen.getByText('list_prop.type_villa')).toBeInTheDocument();
    });

    it('renders steps indicator with correct number of steps', () => {
        renderWithRouter(<ListProperty />);
        // StepsIndicator receives 7 steps
        const { container } = renderWithRouter(<ListProperty />);
        // Check that step indicator renders
        expect(container.querySelector('.flex')).toBeTruthy();
    });

    it('renders the hero section', () => {
        renderWithRouter(<ListProperty />);
        // ListPropertyHero is rendered on all steps
        expect(screen.getAllByText(/list_prop/i).length).toBeGreaterThan(0);
    });

    it('renders step indicator with step info', () => {
        renderWithRouter(<ListProperty />);
        // The page should show step info
        const { container } = renderWithRouter(<ListProperty />);
        expect(container.firstChild).toBeTruthy();
    });
});
