import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate, mockToast } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockToast: {
        error: vi.fn(),
        success: vi.fn(),
        loading: vi.fn()
    }
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', full_name: 'Test User', role: 'host' },
        isAuthenticated: true
    })
}));

vi.mock('../context/ModalContext', () => ({
    useModal: () => ({
        openRegister: vi.fn(),
        openLogin: vi.fn()
    })
}));

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({
        theme: 'light',
        toggleTheme: vi.fn()
    })
}));

vi.mock('react-hot-toast', () => ({
    default: mockToast
}));

// Rule 3: API mocks
vi.mock('../api-services', () => ({
    db: {
        createProperty: vi.fn().mockResolvedValue({ id: 'new-prop-1' }),
        uploadImage: vi.fn().mockResolvedValue('http://example.com/image.jpg'),
        getLocations: vi.fn().mockResolvedValue([
            { id: 'loc-1', name: 'Alanya' },
            { id: 'loc-2', name: 'Antalya' }
        ])
    }
}));

// Mock components that might be complex
vi.mock('@react-google-maps/api', () => ({
    GoogleMap: ({ children }: any) => <div data-testid="google-map">{children}</div>,
    useJsApiLoader: () => ({ isLoaded: true }),
    MarkerF: () => <div data-testid="map-marker" />
}));

// LocationPicker: simulate address selection via a button
vi.mock('../components/ui/LocationPicker', () => ({
    LocationPicker: ({ onAddressSelect }: any) => (
        <button data-testid="pick-location" onClick={() => onAddressSelect('Alanya, Turkey', 'Alanya')}>
            Pick Location
        </button>
    )
}));

// Mock PhotoUploader to simulate file upload
vi.mock('../components/ui/PhotoUploader', () => ({
    PhotoUploader: ({ files, onChange }: any) => (
        <div data-testid="photo-uploader">
            <button
                data-testid="add-photo"
                onClick={() => {
                    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
                    onChange([...files, mockFile]);
                }}
            >
                Add Photo
            </button>
            <button
                data-testid="remove-photo"
                onClick={() => onChange(files.slice(0, -1))}
                disabled={files.length === 0}
            >
                Remove Photo
            </button>
            <span data-testid="file-count">{files.length}</span>
        </div>
    )
}));

// Mock PropertyHospitality component
vi.mock('../components/host/properties/steps/PropertyHospitality', () => ({
    PropertyHospitality: ({ formData, handleChange }: any) => (
        <div data-testid="property-hospitality">
            <input
                data-testid="check-in-time"
                value={formData.checkInTime || ''}
                onChange={(e: any) => handleChange({ target: { name: 'checkInTime', value: e.target.value } })}
                placeholder="Check-in Time"
            />
            <input
                data-testid="check-out-time"
                value={formData.checkOutTime || ''}
                onChange={(e: any) => handleChange({ target: { name: 'checkOutTime', value: e.target.value } })}
                placeholder="Check-out Time"
            />
            <input
                data-testid="price-input"
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={(e: any) => handleChange({ target: { name: 'price', value: e.target.value } })}
                placeholder="Base price"
            />
            <input
                data-testid="cleaning-fee-input"
                type="number"
                name="cleaningFee"
                value={formData.cleaningFee || ''}
                onChange={(e: any) => handleChange({ target: { name: 'cleaningFee', value: e.target.value } })}
                placeholder="Cleaning fee"
            />
        </div>
    )
}));

// Import component after mocks
import { ListProperty } from './ListProperty';


describe('ListProperty Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
    });

    const renderPage = () => {
        return render(
            <MemoryRouter>
                <ListProperty />
            </MemoryRouter>
        );
    };

    it('renders step 1 (property type) initially', () => {
        renderPage();
        expect(screen.getByText('list_prop.step1_title')).toBeInTheDocument();
        expect(screen.getByText('list_prop.type_apt')).toBeInTheDocument();
    });

    it('shows error if clicking next without selecting type', () => {
        renderPage();
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(mockToast.error).toHaveBeenCalledWith('list_prop.error.type');
    });

    it('transitions to step 2 (location) after type selection', async () => {
        renderPage();
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));

        expect(screen.getByText('list_prop.step2_title')).toBeInTheDocument();
    });

    it('navigates back to previous step', () => {
        renderPage();
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        
        expect(screen.getByText('list_prop.step2_title')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('list_prop.back'));
        expect(screen.getByText('list_prop.step1_title')).toBeInTheDocument();
    });

    it('validates location step', () => {
        renderPage();
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Try next without location
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(mockToast.error).toHaveBeenCalledWith('list_prop.error.location');
    });

    it('reaches the success state after completing all steps', async () => {
        renderPage();
        
        // Step 1: Type
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Step 2: Location — simulate selecting via LocationPicker mock
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Step 3: Basics
        expect(screen.getByText('list_prop.step3_title')).toBeInTheDocument();
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Step 4: Amenities
        expect(screen.getByText('list_prop.step4_title')).toBeInTheDocument();
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 5: Photos - add a photo first
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 6: Description - fill required
        const titleInput = screen.getByPlaceholderText(/prop_form.title/i) as HTMLInputElement;
        fireEvent.change(titleInput, { target: { value: 'Test Property' } });
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 7: Pricing - fill price
        const priceInput = screen.getByTestId('price-input') as HTMLInputElement;
        fireEvent.change(priceInput, { target: { value: '100' } });
        fireEvent.click(screen.getByText('list_prop.publish'));

        await vi.waitFor(() => {
            expect(screen.getByText('list_prop.success.title')).toBeInTheDocument();
        });
    });

    it('completes step 3 (basics) and moves to step 4 (amenities)', async () => {
        renderPage();

        // Step 1: Type
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 2: Location
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 3: Basics - just proceed (counters have defaults)
        expect(screen.getByText('list_prop.step3_title')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('list_prop.next'));

        // Should move to step 4
        expect(screen.getByText('list_prop.step4_title')).toBeInTheDocument();
    });

    it('allows selecting amenities in step 4 and moves to step 5', async () => {
        renderPage();

        // Navigate to step 4 (amenities)
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next')); // Skip basics

        // Step 4: Amenities
        expect(screen.getByText('list_prop.step4_title')).toBeInTheDocument();
        
        // Select an amenity
        const amenityCheckbox = screen.getByLabelText(/wifi/i) as HTMLInputElement;
        fireEvent.click(amenityCheckbox);
        expect(amenityCheckbox.checked).toBe(true);

        // Move to next step
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(screen.getByText('list_prop.step5_title')).toBeInTheDocument();
    });

    it('validates photo upload in step 5', async () => {
        renderPage();

        // Navigate to step 5 (photos)
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next')); // Skip basics
        fireEvent.click(screen.getByText('list_prop.next')); // Skip amenities

        // Step 5: Photos - try to proceed without photos
        expect(screen.getByText('list_prop.step5_title')).toBeInTheDocument();
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(mockToast.error).toHaveBeenCalledWith('list_prop.error.photo');

        // Add a photo
        fireEvent.click(screen.getByTestId('add-photo'));
        expect(screen.getByTestId('file-count').textContent).toBe('1');

        // Now should proceed
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(screen.getByText('list_prop.step6_title')).toBeInTheDocument();
    });

    it('allows removing photos in step 5', async () => {
        renderPage();

        // Navigate to step 5
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Add two photos
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByTestId('add-photo'));
        expect(screen.getByTestId('file-count').textContent).toBe('2');

        // Remove one photo
        fireEvent.click(screen.getByTestId('remove-photo'));
        expect(screen.getByTestId('file-count').textContent).toBe('1');
    });

    it('completes step 6 (description) with title validation', async () => {
        renderPage();

        // Navigate to step 6 (description)
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 6: Description
        expect(screen.getByText('list_prop.step6_title')).toBeInTheDocument();

        // Try to proceed with short title
        const titleInput = screen.getByPlaceholderText(/prop_form.title/i) as HTMLInputElement;
        fireEvent.change(titleInput, { target: { value: 'Hi' } });
        fireEvent.click(screen.getByText('list_prop.next'));
        expect(mockToast.error).toHaveBeenCalledWith('Title must be at least 5 characters');

        // Enter valid title
        fireEvent.change(titleInput, { target: { value: 'Beautiful Beach Villa' } });
        
        const descriptionTextarea = screen.getByPlaceholderText(/prop_form.description/i) as HTMLTextAreaElement;
        fireEvent.change(descriptionTextarea, { target: { value: 'This is a lovely property' } });

        fireEvent.click(screen.getByText('list_prop.next'));
        expect(screen.getByText('list_prop.step7_title')).toBeInTheDocument();
    });

    it('completes step 7 (pricing) with validation', async () => {
        renderPage();

        // Navigate to step 7 (pricing)
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Step 6: Description - fill required
        const titleInput = screen.getByPlaceholderText(/prop_form.title/i) as HTMLInputElement;
        fireEvent.change(titleInput, { target: { value: 'Beautiful Beach Villa' } });
        const descriptionTextarea = screen.getByPlaceholderText(/prop_form.description/i) as HTMLTextAreaElement;
        fireEvent.change(descriptionTextarea, { target: { value: 'This is a lovely property' } });
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 7: Pricing
        expect(screen.getByText('list_prop.step7_title')).toBeInTheDocument();

        // Try to submit without price
        fireEvent.click(screen.getByText('list_prop.publish'));
        expect(mockToast.error).toHaveBeenCalledWith('list_prop.error.price');

        // Enter price using data-testid
        const priceInput = screen.getByTestId('price-input') as HTMLInputElement;
        fireEvent.change(priceInput, { target: { value: '150' } });

        // Enter cleaning fee using data-testid
        const cleaningFeeInput = screen.getByTestId('cleaning-fee-input') as HTMLInputElement;
        fireEvent.change(cleaningFeeInput, { target: { value: '50' } });

        // Submit should work now - need to wait for async operations
        fireEvent.click(screen.getByText('list_prop.publish'));
        
        await vi.waitFor(() => {
            expect(screen.getByText('list_prop.success.title')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('fills hospitality fields in step 7', async () => {
        renderPage();

        // Navigate to step 7
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Step 6: Fill required
        const titleInput = screen.getByPlaceholderText(/prop_form.title/i) as HTMLInputElement;
        fireEvent.change(titleInput, { target: { value: 'Beautiful Beach Villa' } });
        const descriptionTextarea = screen.getByPlaceholderText(/prop_form.description/i) as HTMLTextAreaElement;
        fireEvent.change(descriptionTextarea, { target: { value: 'Description here' } });
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 7: Fill hospitality
        expect(screen.getByTestId('property-hospitality')).toBeInTheDocument();
        
        const checkInInput = screen.getByTestId('check-in-time') as HTMLInputElement;
        fireEvent.change(checkInInput, { target: { value: '15:00' } });
        expect(checkInInput.value).toBe('15:00');
    });

    it('fills promotion fields in step 7', async () => {
        renderPage();

        // Navigate to step 7
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Step 6: Fill required
        const titleInput = screen.getByPlaceholderText(/prop_form.title/i) as HTMLInputElement;
        fireEvent.change(titleInput, { target: { value: 'Beautiful Beach Villa' } });
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 7: Fill promotion - use getAllByPlaceholderText since there are multiple inputs with "0"
        const promotionInputs = screen.getAllByPlaceholderText(/0/i);
        const promotionPriceInput = promotionInputs[1] as HTMLInputElement; // Second "0" placeholder is promotion price
        fireEvent.change(promotionPriceInput, { target: { value: '100' } });
        
        const promotionDescInput = screen.getByPlaceholderText(/e\.g\. Early bird/i) as HTMLTextAreaElement;
        fireEvent.change(promotionDescInput, { target: { value: 'Summer discount' } });

        expect(promotionPriceInput.value).toBe('100');
        expect(promotionDescInput.value).toBe('Summer discount');
    });

    it('submits complete property listing successfully', async () => {
        renderPage();

        // Complete all steps
        // Step 1: Type
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 2: Location
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 3: Basics
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 4: Amenities
        const amenityCheckbox = screen.getByLabelText(/wifi/i) as HTMLInputElement;
        fireEvent.click(amenityCheckbox);
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 5: Photos
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 6: Description
        const titleInput = screen.getByPlaceholderText(/prop_form.title/i) as HTMLInputElement;
        fireEvent.change(titleInput, { target: { value: 'Beautiful Beach Villa' } });
        const descriptionTextarea = screen.getByPlaceholderText(/prop_form.description/i) as HTMLTextAreaElement;
        fireEvent.change(descriptionTextarea, { target: { value: 'Amazing property with sea view' } });
        fireEvent.click(screen.getByText('list_prop.next'));

        // Step 7: Pricing - use data-testid to find price input
        const priceInput = screen.getByTestId('price-input') as HTMLInputElement;
        fireEvent.change(priceInput, { target: { value: '200' } });
        fireEvent.click(screen.getByText('list_prop.publish'));

        // Should show success
        await vi.waitFor(() => {
            expect(screen.getByText('list_prop.success.title')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Verify API calls
        const { db } = await import('../api-services');
        expect(db.uploadImage).toHaveBeenCalled();
        expect(db.createProperty).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Beautiful Beach Villa',
            price_per_night: 200,
            status: 'pending'
        }));
    });

    it('shows error when property submission fails', async () => {
        const { db } = await import('../api-services');
        (db.createProperty as any).mockRejectedValue(new Error('Submission failed'));

        renderPage();

        // Complete all steps quickly
        fireEvent.click(screen.getByText('list_prop.type_apt'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('pick-location'));
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByText('list_prop.next'));
        const amenityCheckbox = screen.getByLabelText(/wifi/i) as HTMLInputElement;
        fireEvent.click(amenityCheckbox);
        fireEvent.click(screen.getByText('list_prop.next'));
        fireEvent.click(screen.getByTestId('add-photo'));
        fireEvent.click(screen.getByText('list_prop.next'));
        const titleInput = screen.getByPlaceholderText(/prop_form.title/i) as HTMLInputElement;
        fireEvent.change(titleInput, { target: { value: 'Beautiful Beach Villa' } });
        fireEvent.click(screen.getByText('list_prop.next'));
        
        // Step 7: Pricing - fill in price first using data-testid
        const priceInput = screen.getByTestId('price-input') as HTMLInputElement;
        fireEvent.change(priceInput, { target: { value: '200' } });

        fireEvent.click(screen.getByText('list_prop.publish'));

        await vi.waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('error.generic');
        });
    });
});
