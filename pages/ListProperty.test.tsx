import { describe, it, expect, vi } from 'vitest';
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

const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('ListProperty Component', () => {
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
});
