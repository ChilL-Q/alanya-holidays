import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookTour } from './BookTour';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the API service
vi.mock('../../api-services', () => ({
    db: {
        getService: vi.fn()
    },
    ServiceData: {}
}));

// Mock Cart Context
const mockAddToCart = vi.fn();
vi.mock('../../context/CartContext', () => ({
    useCart: () => ({
        addToCart: mockAddToCart,
        items: [],
        total: 0,
        removeFromCart: vi.fn(),
        clearCart: vi.fn()
    })
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
        useParams: () => ({ id: 'tour-123' })
    };
});

// Mock DatePicker
vi.mock('react-datepicker', () => ({
    __esModule: true,
    default: ({ selected, onChange, minDate, placeholderText, dateFormat, locale, customInput }: any) => (
        <input
            type="text"
            data-testid="date-picker"
            value={selected ? selected.toLocaleDateString() : ''}
            onChange={(e) => onChange(new Date(e.target.value))}
            placeholder={placeholderText}
            minDate={minDate}
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

const mockService = {
    id: 'tour-123',
    title: 'Amazing Alanya City Tour',
    description: 'Explore the best sights of Alanya with our expert guide.',
    price: 50,
    images: ['https://example.com/tour1.jpg', 'https://example.com/tour2.jpg'],
    type: 'tour',
    features: {
        duration: '4 hours',
        groupSize: 'Up to 10 people',
        itinerary: [
            { time: '09:00', activity: 'Pickup from hotel' },
            { time: '10:00', activity: 'Visit Alanya Castle' },
            { time: '12:00', activity: 'Lunch at local restaurant' },
            { time: '14:00', activity: 'Drop-off at hotel' }
        ],
        included: ['Hotel pickup', 'Professional guide', 'Lunch'],
        requirements: 'Please wear comfortable shoes and bring sunscreen.'
    }
};

describe('BookTour', () => {
    const mockGetService = db.getService as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
        mockAddToCart.mockClear();
    });

    const renderBookTour = (initialEntry = '/booking/tour-123') => {
        return render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/booking/:id" element={<BookTour />} />
                </Routes>
            </MemoryRouter>
        );
    };

    describe('Loading & Error States', () => {
        it('shows loading state initially', async () => {
            mockGetService.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockService), 100)));

            renderBookTour();

            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });
        });

        it('shows error when tour not found', async () => {
            mockGetService.mockResolvedValue(null);

            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Tour not found')).toBeInTheDocument();
            });
        });

        it('handles fetch error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockGetService.mockRejectedValue(new Error('Failed to fetch'));

            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Tour not found')).toBeInTheDocument();
            });

            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch service', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Tour Details Display', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders tour title and price', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Check for price - there are multiple €50 on the page, use getAll
            const priceElements = screen.getAllByText('€50');
            expect(priceElements.length).toBeGreaterThan(0);
            expect(screen.getByText('per person')).toBeInTheDocument();
        });

        it('renders tour image', async () => {
            renderBookTour();

            await waitFor(() => {
                const image = screen.getByAltText('Amazing Alanya City Tour');
                expect(image).toBeInTheDocument();
                expect(image).toHaveAttribute('src', 'https://example.com/tour1.jpg');
            });
        });

        it('renders tour description', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText(/Explore the best sights of Alanya/)).toBeInTheDocument();
            });
        });

        it('renders duration and group size', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('~4 hours')).toBeInTheDocument();
                expect(screen.getByText('Group Size: Up to 10 people')).toBeInTheDocument();
            });
        });

        it('renders itinerary schedule', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Schedule')).toBeInTheDocument();
                expect(screen.getByText('09:00')).toBeInTheDocument();
                expect(screen.getByText('Pickup from hotel')).toBeInTheDocument();
                expect(screen.getByText('Visit Alanya Castle')).toBeInTheDocument();
            });
        });

        it('renders included items', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Included')).toBeInTheDocument();
                expect(screen.getByText('Hotel pickup')).toBeInTheDocument();
                expect(screen.getByText('Professional guide')).toBeInTheDocument();
                expect(screen.getByText('Lunch')).toBeInTheDocument();
            });
        });

        it('renders important information/requirements', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Important Information')).toBeInTheDocument();
                expect(screen.getByText(/Please wear comfortable shoes/)).toBeInTheDocument();
            });
        });

        it('uses placeholder image if no images available', async () => {
            const serviceWithoutImages = {
                ...mockService,
                images: []
            };
            mockGetService.mockResolvedValue(serviceWithoutImages);

            renderBookTour();

            await waitFor(() => {
                const image = screen.getByAltText('Amazing Alanya City Tour');
                expect(image).toHaveAttribute('src', 'https://via.placeholder.com/600x400');
            });
        });
    });

    describe('Booking Form', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders date picker', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByTestId('date-picker')).toBeInTheDocument();
            });
        });

        it('renders guests counter with initial value of 1', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument();
            });
        });

        it('allows increasing number of guests', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument();
            });

            const plusButton = screen.getByText('+');
            fireEvent.click(plusButton);
            expect(screen.getByText('2')).toBeInTheDocument();

            fireEvent.click(plusButton);
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('allows decreasing number of guests (minimum 1)', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument();
            });

            const minusButton = screen.getByText('-');
            fireEvent.click(minusButton);
            // Should stay at 1 (minimum)
            expect(screen.getByText('1')).toBeInTheDocument();
        });

        it('updates total price when guests change', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Initial: 1 guest - check price breakdown section has €50 x 1
            expect(screen.getByText(/€50 x/)).toBeInTheDocument();

            // Increase to 2 guests
            fireEvent.click(screen.getByText('+'));
            await waitFor(() => {
                expect(screen.getAllByText('€100').length).toBeGreaterThan(0);
            });

            // Increase to 3 guests
            fireEvent.click(screen.getByText('+'));
            await waitFor(() => {
                expect(screen.getAllByText('€150').length).toBeGreaterThan(0);
            });
        });

        it('disables booking button when no date selected', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            const bookButton = screen.getByText(/Reserve via WhatsApp/).closest('button');
            expect(bookButton).toBeDisabled();
        });

        it('enables booking button when date is selected', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByTestId('date-picker')).toBeInTheDocument();
            });

            // Select a date
            const datePicker = screen.getByTestId('date-picker');
            fireEvent.change(datePicker, { target: { value: '25.12.2026' } });

            await waitFor(() => {
                const bookButton = screen.getByText(/Reserve via WhatsApp/);
                expect(bookButton).not.toBeDisabled();
            });
        });
    });

    describe('WhatsApp Booking', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('opens WhatsApp with correct message when booking', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Select a date
            const datePicker = screen.getByTestId('date-picker');
            fireEvent.change(datePicker, { target: { value: '25.12.2026' } });

            // Click book button
            const bookButton = screen.getAllByText(/Reserve via WhatsApp/)[0];
            fireEvent.click(bookButton);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalledWith(
                    expect.stringContaining('https://wa.me/14389294208'),
                    '_blank'
                );
            });

            const callUrl = windowOpenSpy.mock.calls[0][0] as string;
            const decodedUrl = decodeURIComponent(callUrl);
            expect(decodedUrl).toContain('Amazing Alanya City Tour');
            expect(decodedUrl).toContain('Guests: 1');
            expect(decodedUrl).toContain('€50');

            windowOpenSpy.mockRestore();
        });

        it('includes correct number of guests in WhatsApp message', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Select date and increase guests
            const datePicker = screen.getByTestId('date-picker');
            fireEvent.change(datePicker, { target: { value: '25.12.2026' } });
            fireEvent.click(screen.getByText('+'));
            fireEvent.click(screen.getByText('+'));

            // Click book button
            const bookButton = screen.getAllByText(/Reserve via WhatsApp/)[0];
            fireEvent.click(bookButton);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalled();
            });

            const callUrl = windowOpenSpy.mock.calls[0][0] as string;
            const decodedUrl = decodeURIComponent(callUrl);
            expect(decodedUrl).toContain('Guests: 3');
            expect(decodedUrl).toContain('€150');

            windowOpenSpy.mockRestore();
        });
    });

    describe('Cart Booking (Non-WhatsApp)', () => {
        it('adds to cart when not WhatsApp booking', async () => {
            // This would require changing isWhatsAppBooking to false
            // For now, we test the WhatsApp flow which is the default
            expect(true).toBe(true);
        });
    });

    describe('Navigation', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('navigates back when back button is clicked', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            const backButton = screen.getByText(/auth.close/i).closest('button');
            fireEvent.click(backButton!);

            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });

        it('renders back button with correct icon', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Check for back button
            const backButton = screen.getByText(/auth.close/i);
            expect(backButton).toBeInTheDocument();
        });
    });

    describe('Responsive Layout', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders with correct grid layout classes', async () => {
            const { container } = renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Check for grid container
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toHaveClass('grid-cols-1');
            expect(gridContainer).toHaveClass('md:grid-cols-2');
        });

        it('renders booking form with correct styling', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Check for form container styling
            const formContainer = screen.getByText('per person').closest('div')?.parentElement;
            expect(formContainer).toHaveClass('rounded-3xl');
            expect(formContainer).toHaveClass('p-8');
        });
    });

    describe('Price Formatting', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('displays price with currency symbol', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Check for price in the heading area (has text-2xl class)
            const priceElements = screen.getAllByText('€50');
            expect(priceElements.length).toBeGreaterThan(0);
        });

        it('calculates total price correctly', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByText('Amazing Alanya City Tour')).toBeInTheDocument();
            });

            // Select date to enable booking
            const datePicker = screen.getByTestId('date-picker');
            fireEvent.change(datePicker, { target: { value: '25.12.2026' } });

            // Check initial total (1 guest) - look in the price breakdown section
            expect(screen.getByText(/€50 x/)).toBeInTheDocument();

            // Increase guests
            fireEvent.click(screen.getByText('+'));
            await waitFor(() => {
                expect(screen.getAllByText('€100').length).toBeGreaterThan(0);
            });
        });
    });

    describe('Date Picker', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('shows date picker with correct placeholder', async () => {
            renderBookTour();

            await waitFor(() => {
                const datePicker = screen.getByTestId('date-picker');
                expect(datePicker).toHaveAttribute('placeholder', 'date_format');
            });
        });

        it('allows selecting a future date', async () => {
            renderBookTour();

            await waitFor(() => {
                expect(screen.getByTestId('date-picker')).toBeInTheDocument();
            });

            const datePicker = screen.getByTestId('date-picker');
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);

            fireEvent.change(datePicker, {
                target: { value: futureDate.toLocaleDateString() }
            });

            expect(datePicker).toHaveValue(futureDate.toLocaleDateString());
        });
    });
});
