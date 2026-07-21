import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { HostEditServicePage } from './HostEditServicePage';
import { servicesService, storageService } from '../../api-services';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate, mockToast } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockToast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn()
    }
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'service-1' })
    };
});

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'host-1', full_name: 'Test Host', role: 'host' },
        isAuthenticated: true
    })
}));

vi.mock('react-hot-toast', () => ({
    default: mockToast
}));

vi.mock('../../hooks/useSaveShortcut', () => ({
    useSaveShortcut: vi.fn()
}));

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    servicesService: {
        getService: vi.fn(),
        updateService: vi.fn(),
        requestServiceUpdate: vi.fn()
    },
    storageService: {
        uploadImage: vi.fn()
    }
}));

// Mock subcomponents
vi.mock('../../components/host/services/HostServiceBasicForm', () => ({
    HostServiceBasicForm: ({ formData, setFormData }: any) => (
        <div data-testid="basic-form">
            <input 
                aria-label="Title" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
            />
            <input 
                aria-label="Price" 
                value={formData.price} 
                onChange={e => setFormData({ ...formData, price: e.target.value })} 
            />
            <select 
                aria-label="Type" 
                value={formData.type} 
                onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
                <option value="car">Car</option>
                <option value="tour">Tour</option>
            </select>
        </div>
    )
}));

vi.mock('../../components/host/services/HostServiceFeaturesForm', () => ({
    HostServiceFeaturesForm: () => <div data-testid="features-form" />
}));

vi.mock('../../components/ui/PhotoUploader', () => ({
    PhotoUploader: ({ onChange }: any) => (
        <div data-testid="photo-uploader">
            <button type="button" onClick={() => onChange([new File([], 'new.jpg')])}>Add Photo</button>
        </div>
    )
}));

describe('HostEditServicePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderPage = () => {
        return render(
            <MemoryRouter initialEntries={['/host/services/service-1/edit']}>
                <Routes>
                    <Route path="/host/services/:id/edit" element={<HostEditServicePage />} />
                </Routes>
            </MemoryRouter>
        );
    };

    const mockService = {
        id: 'service-1',
        type: 'car',
        title: 'Original Car',
        description: 'Desc',
        price: 50,
        images: ['img1.jpg'],
        features: { brand: 'Fiat' }
    };

    it('renders service details after loading', async () => {
        (servicesService.getService as any).mockResolvedValue(mockService);
        renderPage();
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByDisplayValue('Original Car')).toBeInTheDocument();
        });
    });

    it('handles load failure', async () => {
        (servicesService.getService as any).mockRejectedValue(new Error('Load failed'));
        renderPage();
        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to load service');
            expect(mockNavigate).toHaveBeenCalledWith('/host/services');
        });
    });

    it('submits changes that need approval', async () => {
        (servicesService.getService as any).mockResolvedValue(mockService);
        (servicesService.requestServiceUpdate as any).mockResolvedValue({});

        renderPage();
        await waitFor(() => expect(screen.getByDisplayValue('Original Car')).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Car Name' } });
        
        const submitBtn = screen.getByRole('button', { name: /Submit Changes/i });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(servicesService.requestServiceUpdate).toHaveBeenCalled();
        expect(screen.getByText('Changes Submitted')).toBeInTheDocument();
    });

    it('submits changes directly if no approval needed', async () => {
        (servicesService.getService as any).mockResolvedValue(mockService);
        (servicesService.updateService as any).mockResolvedValue({});

        renderPage();
        await waitFor(() => expect(screen.getByDisplayValue('Original Car')).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText('Price'), { target: { value: '100' } });
        
        const submitBtn = screen.getByRole('button', { name: /Submit Changes/i });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(servicesService.updateService).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith('Service updated successfully');
    });

    it('handles submit error', async () => {
        (servicesService.getService as any).mockResolvedValue(mockService);
        (servicesService.updateService as any).mockRejectedValue(new Error('Save failed'));

        renderPage();
        await waitFor(() => expect(screen.getByDisplayValue('Original Car')).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText('Price'), { target: { value: '100' } });
        
        const submitBtn = screen.getByRole('button', { name: /Submit Changes/i });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(mockToast.error).toHaveBeenCalledWith('Failed to submit changes');
    });

    it('handles image removal', async () => {
        (servicesService.getService as any).mockResolvedValue(mockService);
        const { container } = renderPage();
        
        // Wait for images to load using container selector
        await waitFor(() => {
            const images = container.querySelectorAll('img');
            expect(images.length).toBeGreaterThan(0);
        });

        // The trash button has a lucide-trash2 svg
        const trashBtn = container.querySelector('svg.lucide-trash2')?.closest('button');
        
        if (trashBtn) {
            fireEvent.click(trashBtn);
            expect(container.querySelectorAll('img').length).toBe(0);
        } else {
            throw new Error('Trash button not found');
        }
    });

    it('handles new photo upload during submit', async () => {
        (servicesService.getService as any).mockResolvedValue(mockService);
        (storageService.uploadImage as any).mockResolvedValue('http://example.com/new.jpg');
        (servicesService.requestServiceUpdate as any).mockResolvedValue({});

        renderPage();
        await waitFor(() => expect(screen.getByDisplayValue('Original Car')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Add Photo'));
        
        const submitBtn = screen.getByRole('button', { name: /Submit Changes/i });
        
        // When submitting is true, button text changes to "Saving..."
        // We need to click it while it's still "Submit Changes"
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(storageService.uploadImage).toHaveBeenCalled();
        expect(servicesService.requestServiceUpdate).toHaveBeenCalled();
    });
});
