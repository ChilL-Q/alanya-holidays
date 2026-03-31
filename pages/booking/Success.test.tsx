import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BookingSuccess } from './Success';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock Language Context
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    CheckCircle: ({ _size, className }: any) => <svg data-testid="check-circle-icon" className={className} />,
    Home: ({ _size, className }: any) => <svg data-testid="home-icon" className={className} />,
    Calendar: ({ _size, className }: any) => <svg data-testid="calendar-icon" className={className} />
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams(), vi.fn()]
    };
});

describe('BookingSuccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockClear();
    });

    const renderBookingSuccess = (sessionId: string | null = 'sess_123', initialEntry = '/booking/success') => {
        const params = sessionId ? `?session_id=${sessionId}` : '';
        return render(
            <MemoryRouter initialEntries={[`${initialEntry}${params}`]}>
                <Routes>
                    <Route path="/booking/success" element={<BookingSuccess />} />
                </Routes>
            </MemoryRouter>
        );
    };

    describe('Redirect without Session ID', () => {
        it('redirects to home when no session_id is provided', async () => {
            // Mock useSearchParams to return null session_id
            vi.mock('react-router-dom', async () => {
                const actual = await vi.importActual('react-router-dom');
                return {
                    ...(actual as object),
                    useNavigate: () => mockNavigate,
                    useSearchParams: () => [new URLSearchParams(''), vi.fn()]
                };
            });

            // Re-import after mock update
            const { BookingSuccess: BookingSuccessNoSession } = await import('./Success');

            render(
                <MemoryRouter initialEntries={['/booking/success']}>
                    <Routes>
                        <Route path="/booking/success" element={<BookingSuccessNoSession />} />
                    </Routes>
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/');
            });
        });
    });

    describe('Success Page Display', () => {
        it('renders success page with check circle icon', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
            });
        });

        it('renders success title', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                expect(screen.getByText('booking.success.title')).toBeInTheDocument();
            });
        });

        it('renders success message', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                expect(screen.getByText('booking.success.message')).toBeInTheDocument();
            });
        });

        it('renders check circle icon with correct styling', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const icon = screen.getByTestId('check-circle-icon');
                expect(icon).toHaveClass('text-green-600');
                expect(icon).toHaveClass('dark:text-green-400');
            });
        });

        it('renders icon container with correct styling', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const iconContainer = screen.getByTestId('check-circle-icon').parentElement;
                expect(iconContainer).toHaveClass('bg-green-100');
                expect(iconContainer).toHaveClass('dark:bg-green-900/30');
                expect(iconContainer).toHaveClass('rounded-full');
            });
        });

        it('renders main container with correct styling', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const card = document.querySelector('.rounded-3xl.shadow-xl');
                expect(card).toHaveClass('bg-white');
                expect(card).toHaveClass('dark:bg-slate-800/80');
            });
        });

        it('renders page with correct background', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const pageContainer = document.querySelector('.min-h-screen');
                expect(pageContainer).toHaveClass('bg-slate-50');
                expect(pageContainer).toHaveClass('dark:bg-slate-900');
            });
        });

        it('renders with animation classes', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const card = document.querySelector('.animate-in');
                expect(card).toBeInTheDocument();
                expect(card).toHaveClass('fade-in');
                expect(card).toHaveClass('zoom-in');
            });
        });
    });

    describe('Navigation Buttons', () => {
        it('renders "View My Bookings" button with Calendar icon', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                expect(screen.getByText('booking.success.my_bookings')).toBeInTheDocument();
                expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
            });
        });

        it('renders "Return to Home" button with Home icon', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                expect(screen.getByText('booking.success.home')).toBeInTheDocument();
                expect(screen.getByTestId('home-icon')).toBeInTheDocument();
            });
        });

        it('renders "View My Bookings" button with correct link', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const bookingsLink = screen.getByText('booking.success.my_bookings').closest('a');
                expect(bookingsLink).toHaveAttribute('href', '/inbox');
            });
        });

        it('renders "Return to Home" button with correct link', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const homeLink = screen.getByText('booking.success.home').closest('a');
                expect(homeLink).toHaveAttribute('href', '/');
            });
        });

        it('renders "View My Bookings" button with correct styling', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const bookingsButton = screen.getByText('booking.success.my_bookings').closest('a');
                expect(bookingsButton).toHaveClass('bg-teal-600');
                expect(bookingsButton).toHaveClass('dark:bg-cyan-600');
                expect(bookingsButton).toHaveClass('text-white');
            });
        });

        it('renders "Return to Home" button with correct styling', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const homeButton = screen.getByText('booking.success.home').closest('a');
                expect(homeButton).toHaveClass('bg-slate-100');
                expect(homeButton).toHaveClass('dark:bg-slate-800/50');
                expect(homeButton).toHaveClass('text-slate-900');
            });
        });

        it('renders buttons with correct layout', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const buttonsContainer = screen.getByText('booking.success.my_bookings').closest('div');
                expect(buttonsContainer).toHaveClass('space-y-3');
            });
        });

        it('renders buttons as block elements with full width', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const bookingsButton = screen.getByText('booking.success.my_bookings').closest('a');
                expect(bookingsButton).toHaveClass('block');
                expect(bookingsButton).toHaveClass('w-full');
            });
        });

        it('renders buttons with flex layout for icons', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const bookingsButton = screen.getByText('booking.success.my_bookings').closest('a');
                expect(bookingsButton).toHaveClass('flex');
                expect(bookingsButton).toHaveClass('items-center');
                expect(bookingsButton).toHaveClass('justify-center');
                expect(bookingsButton).toHaveClass('gap-2');
            });
        });
    });

    describe('Responsive Layout', () => {
        it('renders with correct max-width container', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const card = document.querySelector('.max-w-md');
                expect(card).toBeInTheDocument();
            });
        });

        it('renders with correct padding', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const card = document.querySelector('.p-8');
                expect(card).toBeInTheDocument();
            });
        });

        it('renders page with flex layout for centering', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const pageContainer = document.querySelector('.min-h-screen');
                expect(pageContainer).toHaveClass('flex');
                expect(pageContainer).toHaveClass('items-center');
                expect(pageContainer).toHaveClass('justify-center');
            });
        });

        it('renders with responsive padding', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const pageContainer = document.querySelector('.min-h-screen');
                expect(pageContainer).toHaveClass('px-4');
            });
        });
    });

    describe('Typography', () => {
        it('renders title with correct typography', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const title = screen.getByText('booking.success.title');
                expect(title).toHaveClass('text-2xl');
                expect(title).toHaveClass('font-bold');
                expect(title).toHaveClass('text-slate-900');
            });
        });

        it('renders message with correct typography', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const message = screen.getByText('booking.success.message');
                expect(message).toHaveClass('text-slate-600');
                expect(message).toHaveClass('dark:text-slate-400');
            });
        });

        it('renders button text with correct typography', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const buttonText = screen.getByText('booking.success.my_bookings');
                expect(buttonText).toHaveClass('font-semibold');
            });
        });
    });

    describe('Dark Mode Support', () => {
        it('renders card with dark mode background', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const card = document.querySelector('.dark\\:bg-slate-800\\/80');
                expect(card).toBeInTheDocument();
            });
        });

        it('renders title with dark mode text color', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const title = screen.getByText('booking.success.title');
                expect(title).toHaveClass('dark:text-white');
            });
        });

        it('renders icon with dark mode color', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const icon = screen.getByTestId('check-circle-icon');
                expect(icon).toHaveClass('dark:text-green-400');
            });
        });

        it('renders home button with dark mode hover', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const homeButton = screen.getByText('booking.success.home').closest('a');
                expect(homeButton).toHaveClass('dark:hover:bg-slate-600');
                expect(homeButton).toHaveClass('dark:text-white');
            });
        });
    });

    describe('Accessibility', () => {
        it('renders icons with proper SVG structure', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const checkIcon = screen.getByTestId('check-circle-icon');
                expect(checkIcon.tagName).toBe('svg');
            });
        });

        it('renders links with proper anchor structure', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const bookingsLink = screen.getByText('booking.success.my_bookings').closest('a');
                expect(bookingsLink?.tagName).toBe('A');
                expect(bookingsLink).toHaveAttribute('href');
            });
        });

        it('renders page with semantic structure', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const heading = screen.getByRole('heading', { level: 1 });
                expect(heading).toBeInTheDocument();
            });
        });
    });

    describe('Component Structure', () => {
        it('renders complete component structure', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
                expect(screen.getByText('booking.success.title')).toBeInTheDocument();
                expect(screen.getByText('booking.success.message')).toBeInTheDocument();
                expect(screen.getByText('booking.success.my_bookings')).toBeInTheDocument();
                expect(screen.getByText('booking.success.home')).toBeInTheDocument();
            });
        });

        it('renders icon container with correct dimensions', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const iconContainer = screen.getByTestId('check-circle-icon').parentElement;
                expect(iconContainer).toHaveClass('w-20');
                expect(iconContainer).toHaveClass('h-20');
            });
        });

        it('renders icon with correct classes', async () => {
            renderBookingSuccess('sess_123');

            await waitFor(() => {
                const icon = screen.getByTestId('check-circle-icon');
                expect(icon).toHaveClass('w-10');
                expect(icon).toHaveClass('h-10');
            });
        });
    });
});
