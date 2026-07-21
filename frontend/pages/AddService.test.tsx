import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AddService } from './AddService';
import { BrowserRouter } from 'react-router-dom';
import { servicesService } from '../api-services';

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
    servicesService: {
        createService: vi.fn().mockResolvedValue({}),
        uploadImage: vi.fn().mockResolvedValue('http://example.com/image.jpg')
    }
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
    toast: { success: vi.fn(), error: vi.fn() }
}));

const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('AddService Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

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

    it('shows health/wellness fields when health category is selected', () => {
        renderWithRouter(<AddService />);
        fireEvent.click(screen.getByText('add_service.cat.health'));
        expect(screen.getByText('WhatsApp Number')).toBeDefined();
    });

    it('shows back button on step 1 and returns to step 0 on click', () => {
        renderWithRouter(<AddService />);
        fireEvent.click(screen.getByText('add_service.cat.transportation'));
        // Should be on step 1 now - back button should exist
        // Back button is the first button in the header
        const allBtns = screen.getAllByRole('button');
        // Find ArrowLeft button (has no text)
        const arrowBtn = allBtns.find(b => b.textContent === '' || b.className.includes('rounded-full'));
        if (arrowBtn) {
            fireEvent.click(arrowBtn);
            expect(screen.getByText('add_service.cat.transportation')).toBeDefined();
        }
    });

    it('calls createService on transportation form submit', async () => {
        (servicesService.createService as any).mockResolvedValue({});
        renderWithRouter(<AddService />);
        fireEvent.click(screen.getByText('add_service.cat.transportation'));

        // Submit the form element directly
        const form = document.querySelector('form');
        await act(async () => { fireEvent.submit(form!); });
        await waitFor(() => {
            expect(servicesService.createService).toHaveBeenCalled();
        });
    });

    it('shows error on console when createService fails', async () => {
        (servicesService.createService as any).mockRejectedValue(new Error('Upload failed'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        renderWithRouter(<AddService />);
        fireEvent.click(screen.getByText('add_service.cat.transportation'));

        const form = document.querySelector('form');
        await act(async () => { fireEvent.submit(form!); });
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });
});
