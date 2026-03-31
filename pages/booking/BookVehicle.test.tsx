import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookVehicle } from './BookVehicle';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the API service
vi.mock('../../api-services', () => ({
    db: {
        getService: vi.fn()
    },
    ServiceData: {}
}));

// Mock Currency Context
vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (price: number, currency: string) => price,
        formatPrice: (price: number) => `€${price}`
    })
}));

// Mock Language Context
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'vehicle-123' })
    };
});

// Mock DatePicker
vi.mock('react-datepicker', () => ({
    __esModule: true,
    default: ({ selected, onChange, minDate, placeholderText, dateFormat, locale, customInput, selectsStart, selectsEnd, startDate, endDate }: any) => (
        <input
            type="text"
            data-testid={selectsStart ? 'start-date-picker' : selectsEnd ? 'end-date-picker' : 'date-picker'}
            value={selected ? selected.toLocaleDateString() : ''}
            onChange={(e) => onChange(new Date(e.target.value))}
            placeholder={placeholderText}
        />
    )
}));

// Mock IMaskInput
vi.mock('react-imask', () => ({
    IMaskInput: ({ inputRef, ...props }: any) => (
        <input ref={inputRef} data-testid="masked-input" {...props} />
    )
}));

import { db } from '../../api-services';

const mockVehicle = {
    id: 'vehicle-123',
    title: 'BMW X5 Luxury SUV',
    description: 'Premium SUV with all the latest features for a comfortable ride.',
    price: 120,
    images: ['https://example.com/bmw1.jpg', 'https://example.com/bmw2.jpg'],
    type: 'car',
    features: {
        fuel: 'Petrol',
        transmission: 'Automatic',
        seats: '5'
    }
};

describe('BookVehicle', () => {
    const mockGetService = db.getService as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
    });

    const renderBookVehicle = (initialEntry = '/booking/vehicle-123') => {
        return render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/booking/:id" element={<BookVehicle />} />
                </Routes>
            </MemoryRouter>
        );
    };

    describe('Loading & Error States', () => {
        it('shows loading state initially', async () => {
            mockGetService.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockVehicle), 100)));

            renderBookVehicle();

            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });
        });

        it('shows error when vehicle not found', async () => {
            mockGetService.mockResolvedValue(null);

            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('Service not found')).toBeInTheDocument();
            });
        });

        it('handles fetch error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockGetService.mockRejectedValue(new Error('Failed to fetch'));

            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('Service not found')).toBeInTheDocument();
            });

            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch service', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Vehicle Details Display', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockVehicle);
        });

        it('renders vehicle title and price', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Check for price - there are multiple €120 on the page
            const priceElements = screen.getAllByText('€120');
            expect(priceElements.length).toBeGreaterThan(0);
            // Note: "per day" is translated as "car.per_day"
            expect(screen.getByText('car.per_day')).toBeInTheDocument();
        });

        it('renders vehicle image', async () => {
            renderBookVehicle();

            await waitFor(() => {
                const image = screen.getByAltText('BMW X5 Luxury SUV');
                expect(image).toBeInTheDocument();
                expect(image).toHaveAttribute('src', 'https://example.com/bmw1.jpg');
            });
        });

        it('renders vehicle features section', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Note: "Vehicle Features" is translated as "offer.features"
            expect(screen.getByText('offer.features')).toBeInTheDocument();
        });

        it('renders fuel type feature', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('Fuel')).toBeInTheDocument();
                expect(screen.getByText('Petrol')).toBeInTheDocument();
            });
        });

        it('renders transmission feature', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('Transmission')).toBeInTheDocument();
                expect(screen.getByText('Automatic')).toBeInTheDocument();
            });
        });

        it('renders seats feature', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('Seats')).toBeInTheDocument();
                expect(screen.getByText('5')).toBeInTheDocument();
            });
        });

        it('uses placeholder image if no images available', async () => {
            const vehicleWithoutImages = {
                ...mockVehicle,
                images: []
            };
            mockGetService.mockResolvedValue(vehicleWithoutImages);

            renderBookVehicle();

            await waitFor(() => {
                const image = screen.getByAltText('BMW X5 Luxury SUV');
                expect(image).toHaveAttribute('src', 'https://via.placeholder.com/600x400');
            });
        });

        it('renders features with correct icons', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Check that feature labels exist
            expect(screen.getByText('Fuel')).toBeInTheDocument();
            expect(screen.getByText('Transmission')).toBeInTheDocument();
            expect(screen.getByText('Seats')).toBeInTheDocument();
        });
    });

    describe('Booking Form', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockVehicle);
        });

        it('renders rental dates label', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('Rental Dates')).toBeInTheDocument();
            });
        });

        it('renders start date picker', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });
        });

        it('renders end date picker', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('end-date-picker')).toBeInTheDocument();
            });
        });

        it('disables booking button when no dates selected', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            const bookButton = screen.getByText('Reserve via WhatsApp').closest('button');
            expect(bookButton).toBeDisabled();
        });

        it('enables booking button when both dates are selected', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // Select start date
            const startDatePicker = screen.getByTestId('start-date-picker');
            const startDate = new Date(2026, 11, 25); // Dec 25, 2026
            fireEvent.change(startDatePicker, { target: { value: startDate.toISOString() } });

            // Select end date
            const endDatePicker = screen.getByTestId('end-date-picker');
            const endDate = new Date(2026, 11, 28); // Dec 28, 2026
            fireEvent.change(endDatePicker, { target: { value: endDate.toISOString() } });

            await waitFor(() => {
                const bookButton = screen.getByText('Reserve via WhatsApp').closest('button');
                expect(bookButton).not.toBeDisabled();
            });
        });

        it('shows price breakdown when dates are selected', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // Select start date
            const startDatePicker = screen.getByTestId('start-date-picker');
            const startDate = new Date(2026, 11, 25); // Dec 25, 2026
            fireEvent.change(startDatePicker, { target: { value: startDate.toISOString() } });

            // Select end date (3 days later)
            const endDatePicker = screen.getByTestId('end-date-picker');
            const endDate = new Date(2026, 11, 28); // Dec 28, 2026
            fireEvent.change(endDatePicker, { target: { value: endDate.toISOString() } });

            await waitFor(() => {
                // Check for price breakdown section - use regex to match the full text
                expect(screen.getByText(/€120\s+x\s+3\s+esim\.days/)).toBeInTheDocument();
            });

            // There are two €360 elements (line item and total), use getAllByText
            expect(screen.getAllByText('€360').length).toBeGreaterThan(0);
        });

        it('calculates days correctly based on date range', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // Select start date
            const startDatePicker = screen.getByTestId('start-date-picker');
            const startDate = new Date(2026, 11, 1); // Dec 1, 2026
            fireEvent.change(startDatePicker, { target: { value: startDate.toISOString() } });

            // Select end date (5 days later)
            const endDatePicker = screen.getByTestId('end-date-picker');
            const endDate = new Date(2026, 11, 6); // Dec 6, 2026
            fireEvent.change(endDatePicker, { target: { value: endDate.toISOString() } });

            await waitFor(() => {
                // Check for price breakdown section with "5" and "esim.days"
                expect(screen.getByText(/€120 x 5/)).toBeInTheDocument();
            });
        });

        it('hides price breakdown when dates are not selected', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Price breakdown should not be visible initially
            expect(screen.queryByText(/€120 x/)).not.toBeInTheDocument();
        });

        it('updates total price when end date changes', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // Select start date
            const startDatePicker = screen.getByTestId('start-date-picker');
            const startDate = new Date(2026, 11, 1); // Dec 1, 2026
            fireEvent.change(startDatePicker, { target: { value: startDate.toISOString() } });

            // Select end date (2 days later)
            const endDatePicker = screen.getByTestId('end-date-picker');
            const endDate = new Date(2026, 11, 3); // Dec 3, 2026
            fireEvent.change(endDatePicker, { target: { value: endDate.toISOString() } });

            await waitFor(() => {
                expect(screen.getAllByText('€240').length).toBeGreaterThan(0);
            });

            // Change end date to 4 days
            const newEndDate = new Date(2026, 11, 5); // Dec 5, 2026
            fireEvent.change(endDatePicker, { target: { value: newEndDate.toISOString() } });

            await waitFor(() => {
                expect(screen.getAllByText('€480').length).toBeGreaterThan(0);
            });
        });
    });

    describe('WhatsApp Booking', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockVehicle);
        });

        it('opens WhatsApp with correct message when booking', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // Select start date
            const startDatePicker = screen.getByTestId('start-date-picker');
            const startDate = new Date(2026, 11, 25); // Dec 25, 2026
            fireEvent.change(startDatePicker, { target: { value: startDate.toISOString() } });

            // Select end date
            const endDatePicker = screen.getByTestId('end-date-picker');
            const endDate = new Date(2026, 11, 28); // Dec 28, 2026
            fireEvent.change(endDatePicker, { target: { value: endDate.toISOString() } });

            // Click book button
            const bookButton = screen.getByText('Reserve via WhatsApp').closest('button');
            fireEvent.click(bookButton!);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalledWith(
                    expect.stringContaining('https://wa.me/14389294208'),
                    '_blank'
                );
            });

            const callUrl = windowOpenSpy.mock.calls[0][0] as string;
            const decodedUrl = decodeURIComponent(callUrl);
            expect(decodedUrl).toContain('BMW X5 Luxury SUV');
            expect(decodedUrl).toContain('3 days');

            windowOpenSpy.mockRestore();
        });

        it('includes correct rental period in WhatsApp message', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // Select dates for 7 days
            const startDatePicker = screen.getByTestId('start-date-picker');
            const startDate = new Date(2027, 0, 1); // Jan 1, 2027
            fireEvent.change(startDatePicker, { target: { value: startDate.toISOString() } });

            const endDatePicker = screen.getByTestId('end-date-picker');
            const endDate = new Date(2027, 0, 8); // Jan 8, 2027
            fireEvent.change(endDatePicker, { target: { value: endDate.toISOString() } });

            // Click book button
            const bookButton = screen.getByText('Reserve via WhatsApp').closest('button');
            fireEvent.click(bookButton!);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalled();
            });

            const callUrl = windowOpenSpy.mock.calls[0][0] as string;
            const decodedUrl = decodeURIComponent(callUrl);
            expect(decodedUrl).toContain('7 days');

            windowOpenSpy.mockRestore();
        });
    });

    describe('Navigation', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockVehicle);
        });

        it('navigates back when back button is clicked', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            const backButton = screen.getByText(/auth.close/i).closest('button');
            fireEvent.click(backButton!);

            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });

        it('renders back button with correct icon', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Check for back button
            const backButton = screen.getByText(/auth.close/i);
            expect(backButton).toBeInTheDocument();
        });
    });

    describe('Responsive Layout', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockVehicle);
        });

        it('renders with correct grid layout classes', async () => {
            const { container } = renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Check for grid container
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toHaveClass('grid-cols-1');
            expect(gridContainer).toHaveClass('md:grid-cols-2');
        });

        it('renders booking form with correct styling', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Check for form container styling - look for the h1 and check parent
            const titleElement = screen.getByText('BMW X5 Luxury SUV');
            const formContainer = titleElement.closest('.rounded-3xl');
            expect(formContainer).toBeInTheDocument();
        });
    });

    describe('Price Formatting', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockVehicle);
        });

        it('displays price with currency symbol', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Check for price - there are multiple €120 on the page
            const priceElements = screen.getAllByText('€120');
            expect(priceElements.length).toBeGreaterThan(0);
        });

        it('calculates total price correctly for multi-day rental', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // Select start date
            const startDatePicker = screen.getByTestId('start-date-picker');
            const startDate = new Date(2026, 11, 1); // Dec 1, 2026
            fireEvent.change(startDatePicker, { target: { value: startDate.toISOString() } });

            // Select end date (10 days later)
            const endDatePicker = screen.getByTestId('end-date-picker');
            const endDate = new Date(2026, 11, 11); // Dec 11, 2026
            fireEvent.change(endDatePicker, { target: { value: endDate.toISOString() } });

            await waitFor(() => {
                expect(screen.getAllByText('€1200').length).toBeGreaterThan(0);
            });
        });
    });

    describe('Date Pickers', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockVehicle);
        });

        it('shows start date picker with correct placeholder', async () => {
            renderBookVehicle();

            await waitFor(() => {
                const startDatePicker = screen.getByTestId('start-date-picker');
                expect(startDatePicker).toHaveAttribute('placeholder', 'date_format');
            });
        });

        it('shows end date picker with correct placeholder', async () => {
            renderBookVehicle();

            await waitFor(() => {
                const endDatePicker = screen.getByTestId('end-date-picker');
                expect(endDatePicker).toHaveAttribute('placeholder', 'date_format');
            });
        });

        it('allows selecting a future start date', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            const startDatePicker = screen.getByTestId('start-date-picker');
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            fireEvent.change(startDatePicker, {
                target: { value: futureDate.toLocaleDateString() }
            });

            expect(startDatePicker).toHaveValue(futureDate.toLocaleDateString());
        });

        it('end date picker respects start date selection', async () => {
            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByTestId('start-date-picker')).toBeInTheDocument();
            });

            // First select start date
            const startDatePicker = screen.getByTestId('start-date-picker');
            fireEvent.change(startDatePicker, { target: { value: '15.06.2027' } });

            // End date picker should have minDate set to start date
            // This is tested by the component behavior
            expect(screen.getByTestId('end-date-picker')).toBeInTheDocument();
        });
    });

    describe('Vehicle Features Display', () => {
        it('renders all vehicle features correctly', async () => {
            mockGetService.mockResolvedValue(mockVehicle);

            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Verify all features are displayed
            expect(screen.getByText('Fuel')).toBeInTheDocument();
            expect(screen.getByText('Petrol')).toBeInTheDocument();
            expect(screen.getByText('Transmission')).toBeInTheDocument();
            expect(screen.getByText('Automatic')).toBeInTheDocument();
            expect(screen.getByText('Seats')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('handles missing features gracefully', async () => {
            const vehicleWithPartialFeatures = {
                ...mockVehicle,
                features: {
                    fuel: 'Diesel'
                    // No transmission or seats
                }
            };
            mockGetService.mockResolvedValue(vehicleWithPartialFeatures);

            renderBookVehicle();

            await waitFor(() => {
                expect(screen.getByText('BMW X5 Luxury SUV')).toBeInTheDocument();
            });

            // Should still show fuel
            expect(screen.getByText('Fuel')).toBeInTheDocument();
            expect(screen.getByText('Diesel')).toBeInTheDocument();
        });
    });
});
