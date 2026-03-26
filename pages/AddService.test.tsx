import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddService } from './AddService';
import { BrowserRouter } from 'react-router-dom';

// Mock contexts
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id' }
    })
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock API services
vi.mock('../api-services', () => ({
    db: {
        createService: vi.fn().mockResolvedValue({}),
        uploadImage: vi.fn().mockResolvedValue('http://example.com/image.jpg')
    }
}));

const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('AddService Component', () => {
    it('renders category selection step initially', () => {
        renderWithRouter(<AddService />);
        expect(screen.getByText('add_service.title')).toBeDefined();
        expect(screen.getByText('add_service.cat.transportation')).toBeDefined();
        expect(screen.getByText('add_service.cat.adventure')).toBeDefined();
    });

    it('transitions to details form when a category is selected', async () => {
        renderWithRouter(<AddService />);
        
        const transportationBtn = screen.getByText('add_service.cat.transportation');
        fireEvent.click(transportationBtn);

        expect(screen.getByText('Vehicle Details')).toBeDefined();
        expect(screen.getByText('Service Type')).toBeDefined();
    });

    it('shows transportation fields when transportation category is selected', () => {
        renderWithRouter(<AddService />);
        fireEvent.click(screen.getByText('add_service.cat.transportation'));

        expect(screen.getByText('Brand')).toBeDefined();
        expect(screen.getByText('Model')).toBeDefined();
        expect(screen.getByText('Transmission')).toBeDefined();
    });

    it('shows adventure fields when adventure category is selected', () => {
        renderWithRouter(<AddService />);
        fireEvent.click(screen.getByText('add_service.cat.adventure'));

        expect(screen.getByText('Difficulty')).toBeDefined();
        expect(screen.getByText('Duration (Hours)')).toBeDefined();
        expect(screen.getByText('Trip Schedule / Itinerary')).toBeDefined();
    });
});
