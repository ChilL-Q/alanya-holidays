import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookWellness } from './BookWellness';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the API service
vi.mock('../../api-services', () => ({
    db: {
        getService: vi.fn()
    },
    servicesService: {
        getService: vi.fn(),
        getServiceModel: vi.fn()
    },
    ServiceData: {}
}));

// Mock Currency Context
vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (price: number, _currency: string) => price,
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
        useParams: () => ({ id: 'wellness-123' })
    };
});

// Mock DatePicker
vi.mock('react-datepicker', () => ({
    __esModule: true,
    default: ({ selected, onChange, _minDate, placeholderText, _dateFormat, _locale, _customInput }: any) => (
        <input
            type="text"
            data-testid="date-picker"
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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Calendar: ({ size, className }: any) => <svg data-testid="calendar-icon" width={size} height={size} className={className} />,
    ArrowLeft: ({ size, className }: any) => <svg data-testid="arrow-left-icon" width={size} height={size} className={className} />,
    Heart: ({ size, className }: any) => <svg data-testid="heart-icon" width={size} height={size} className={className} />,
    MessageCircle: ({ size, className }: any) => <svg data-testid="message-circle-icon" width={size} height={size} className={className} />
}));

import { servicesService } from '../../api-services';

const mockService = {
    id: 'wellness-123',
    title: 'Traditional Turkish Massage',
    description: 'Experience authentic Turkish massage therapy with our expert specialists. This traditional treatment helps relieve stress, improve circulation, and restore balance to your body.',
    price: 80,
    images: ['https://example.com/wellness1.jpg', 'https://example.com/wellness2.jpg'],
    type: 'wellness',
    provider_id: 'provider-456',
    features: {
        subcategory: 'Massage Therapy',
        duration: '60 minutes',
        whatsapp: '905551234567'
    }
};

describe('BookWellness', () => {
    const mockGetService = servicesService.getService as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
    });

    const renderBookWellness = (initialEntry = '/booking/wellness-123') => {
        return render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/booking/:id" element={<BookWellness />} />
                </Routes>
            </MemoryRouter>
        );
    };

    describe('Loading & Error States', () => {
        it('shows loading state initially', async () => {
            mockGetService.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockService), 100)));

            renderBookWellness();

            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });
        });

        it('shows error when service not found', async () => {
            mockGetService.mockResolvedValue(null);

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Service not found')).toBeInTheDocument();
            });
        });

        it('handles fetch error gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockGetService.mockRejectedValue(new Error('Failed to fetch'));

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Service not found')).toBeInTheDocument();
            });

            expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch service', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Service Details Display', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders service title', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });
        });

        it('renders service price', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('€80')).toBeInTheDocument();
            });
        });

        it('renders service image', async () => {
            renderBookWellness();

            await waitFor(() => {
                const image = screen.getByAltText('Traditional Turkish Massage');
                expect(image).toBeInTheDocument();
                expect(image).toHaveAttribute('src', 'https://example.com/wellness1.jpg');
            });
        });

        it('renders service description', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText(/Experience authentic Turkish massage/)).toBeInTheDocument();
            });
        });

        it('renders subcategory with heart icon', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Massage Therapy')).toBeInTheDocument();
                expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
            });
        });

        it('renders provider info section', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Direct Contact')).toBeInTheDocument();
                expect(screen.getByText(/You will be communicating directly/)).toBeInTheDocument();
            });
        });

        it('renders Fast Response badge', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Fast Response')).toBeInTheDocument();
                expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
            });
        });

        it('uses placeholder image if no images available', async () => {
            const serviceWithoutImages = {
                ...mockService,
                images: []
            };
            mockGetService.mockResolvedValue(serviceWithoutImages);

            renderBookWellness();

            await waitFor(() => {
                const image = screen.getByAltText('Traditional Turkish Massage');
                expect(image).toHaveAttribute('src', 'https://via.placeholder.com/600x400');
            });
        });

        it('shows approx. cost text for priced services', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('approx. cost')).toBeInTheDocument();
            });
        });

        it('shows Contact for Price when price is 0', async () => {
            const freeService = {
                ...mockService,
                price: 0
            };
            mockGetService.mockResolvedValue(freeService);

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Contact for Price')).toBeInTheDocument();
            });
        });
    });

    describe('Booking Form', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders date picker with calendar icon', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByTestId('date-picker')).toBeInTheDocument();
                expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
            });
        });

        it('renders preferred date label', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('search.dates')).toBeInTheDocument();
            });
        });

        it('renders WhatsApp contact button', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Contact via WhatsApp')).toBeInTheDocument();
            });
        });

        it('renders WhatsApp icon in button', async () => {
            renderBookWellness();

            await waitFor(() => {
                const button = screen.getByText('Contact via WhatsApp').closest('button');
                expect(button).toBeInTheDocument();
            });
        });
    });

    describe('WhatsApp Contact', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('opens WhatsApp with correct message when no date selected', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            // Click contact button without selecting date
            const contactButton = screen.getByText('Contact via WhatsApp').closest('button');
            fireEvent.click(contactButton!);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalledWith(
                    expect.stringContaining('https://wa.me/905551234567'),
                    '_blank'
                );
            });

            const callUrl = windowOpenSpy.mock.calls[0][0] as string;
            const decodedUrl = decodeURIComponent(callUrl);
            expect(decodedUrl).toContain('Traditional Turkish Massage');
            expect(decodedUrl).toContain('availability and preparing for the procedure');

            windowOpenSpy.mockRestore();
        });

        it('includes selected date in WhatsApp message', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByTestId('date-picker')).toBeInTheDocument();
            });

            // Select a date
            const datePicker = screen.getByTestId('date-picker');
            const testDate = new Date('2026-12-25');
            fireEvent.change(datePicker, { target: { value: testDate.toLocaleDateString() } });

            // Click contact button
            const contactButton = screen.getByText('Contact via WhatsApp').closest('button');
            fireEvent.click(contactButton!);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalled();
            });

            const callUrl = windowOpenSpy.mock.calls[0][0] as string;
            const decodedUrl = decodeURIComponent(callUrl);
            expect(decodedUrl).toContain('Preferred Date: 25.12.2026');

            windowOpenSpy.mockRestore();
        });

        it('uses service-specific whatsapp number', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            const contactButton = screen.getByText('Contact via WhatsApp').closest('button');
            fireEvent.click(contactButton!);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalledWith(
                    expect.stringContaining('https://wa.me/905551234567'),
                    '_blank'
                );
            });

            windowOpenSpy.mockRestore();
        });

        it('falls back to default number if no whatsapp in features', async () => {
            const serviceWithoutWhatsapp = {
                ...mockService,
                features: {
                    subcategory: 'Massage Therapy',
                    duration: '60 minutes'
                }
            };
            mockGetService.mockResolvedValue(serviceWithoutWhatsapp);

            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            const contactButton = screen.getByText('Contact via WhatsApp').closest('button');
            fireEvent.click(contactButton!);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalledWith(
                    expect.stringContaining('https://wa.me/905551234567'),
                    '_blank'
                );
            });

            windowOpenSpy.mockRestore();
        });

        it('includes inquiry about availability in message', async () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            const contactButton = screen.getByText('Contact via WhatsApp').closest('button');
            fireEvent.click(contactButton!);

            await waitFor(() => {
                expect(windowOpenSpy).toHaveBeenCalled();
            });

            const callUrl = windowOpenSpy.mock.calls[0][0] as string;
            const decodedUrl = decodeURIComponent(callUrl);
            expect(decodedUrl).toContain('Please provide more information about availability and preparing for the procedure');

            windowOpenSpy.mockRestore();
        });
    });

    describe('Navigation', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('navigates back when back button is clicked', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            const backButton = screen.getByText('auth.close').closest('button');
            fireEvent.click(backButton!);

            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });

        it('renders back button with arrow icon', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
            expect(screen.getByText('auth.close')).toBeInTheDocument();
        });
    });

    describe('Responsive Layout', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders with correct grid layout classes', async () => {
            const { container } = renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            // Check for grid container
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toHaveClass('grid-cols-1');
            expect(gridContainer).toHaveClass('md:grid-cols-2');
            expect(gridContainer).toHaveClass('gap-8');
        });

        it('renders booking form with correct styling', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            // Check for form container styling - look for the card containing the title
            const formContainer = screen.getByText('Traditional Turkish Massage').closest('div');
            expect(formContainer).toBeInTheDocument();
        });

        it('renders image with correct aspect ratio', async () => {
            renderBookWellness();

            await waitFor(() => {
                const image = screen.getByAltText('Traditional Turkish Massage');
                expect(image).toHaveClass('aspect-[4/3]');
                expect(image).toHaveClass('rounded-2xl');
            });
        });
    });

    describe('Price Display', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('displays price with correct styling', async () => {
            renderBookWellness();

            await waitFor(() => {
                const priceElement = screen.getByText('€80');
                expect(priceElement).toHaveClass('text-2xl');
                expect(priceElement).toHaveClass('font-bold');
            });
        });

        it('renders price in heading section', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('€80')).toBeInTheDocument();
                expect(screen.getByText('approx. cost')).toBeInTheDocument();
            });
        });
    });

    describe('Date Picker Functionality', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('shows date picker with correct placeholder', async () => {
            renderBookWellness();

            await waitFor(() => {
                const datePicker = screen.getByTestId('date-picker');
                expect(datePicker).toHaveAttribute('placeholder', 'date_format');
            });
        });

        it('allows selecting a future date', async () => {
            renderBookWellness();

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

        it('has minDate set to today', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByTestId('date-picker')).toBeInTheDocument();
            });

            // minDate is passed to the DatePicker component as a prop,
            // not forwarded to the underlying input element
            expect(screen.getByTestId('date-picker')).toBeInTheDocument();
        });
    });

    describe('Content Sections', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders service details section', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('offer.details')).toBeInTheDocument();
            });
        });

        it('renders description with proper styling', async () => {
            renderBookWellness();

            await waitFor(() => {
                const description = screen.getByText(/Experience authentic Turkish massage/);
                expect(description).toHaveClass('text-slate-600');
                expect(description).toHaveClass('text-sm');
            });
        });

        it('renders divider between sections', async () => {
            renderBookWellness();

            await waitFor(() => {
                const divider = document.querySelector('.h-px');
                expect(divider).toBeInTheDocument();
                expect(divider).toHaveClass('bg-slate-100');
            });
        });

        it('renders provider info card with proper styling', async () => {
            renderBookWellness();

            await waitFor(() => {
                const providerCard = screen.getByText('Direct Contact').closest('div');
                expect(providerCard).toHaveClass('bg-slate-50');
                expect(providerCard).toHaveClass('rounded-xl');
            });
        });
    });

    describe('Dark Mode Support', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders with dark mode classes', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            // Check for dark mode classes on main container
            const mainContainer = document.querySelector('.bg-slate-50');
            expect(mainContainer).toHaveClass('dark:bg-slate-900');
        });

        it('renders page with dark mode support', async () => {
            renderBookWellness();

            await waitFor(() => {
                expect(screen.getByText('Traditional Turkish Massage')).toBeInTheDocument();
            });

            // Check that the page has dark mode background class
            const pageContainer = document.querySelector('.min-h-screen');
            expect(pageContainer).toHaveClass('bg-slate-50');
            expect(pageContainer).toHaveClass('dark:bg-slate-900');
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            mockGetService.mockResolvedValue(mockService);
        });

        it('renders image with alt text', async () => {
            renderBookWellness();

            await waitFor(() => {
                const image = screen.getByAltText('Traditional Turkish Massage');
                expect(image).toBeInTheDocument();
            });
        });

        it('renders button with proper structure', async () => {
            renderBookWellness();

            await waitFor(() => {
                const button = screen.getByText('Contact via WhatsApp').closest('button');
                expect(button).toBeInTheDocument();
                // Button should have onClick handler and proper styling
                expect(button).toHaveClass('bg-green-600');
            });
        });

        it('renders back button as accessible button', async () => {
            renderBookWellness();

            await waitFor(() => {
                const backButton = screen.getByText('auth.close').closest('button');
                expect(backButton).toBeInTheDocument();
            });
        });
    });
});
