import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BookingSuccess } from './Success';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { supabase } from '../../api-services/supabase';

// Mock Language Context
vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock Currency Context
vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (amount: number) => `€${amount.toFixed(2)}`
    })
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    CheckCircle: ({ className }: any) => <svg data-testid="check-circle-icon" className={className} />,
    Home: ({ className }: any) => <svg data-testid="home-icon" className={className} />,
    Calendar: ({ className }: any) => <svg data-testid="calendar-icon" className={className} />,
    AlertCircle: ({ className }: any) => <svg data-testid="alert-circle-icon" className={className} />,
    Loader2: ({ className }: any) => <svg data-testid="loader-icon" className={className} />,
    Hash: ({ className }: any) => <svg data-testid="hash-icon" className={className} />,
    Clock: ({ className }: any) => <svg data-testid="clock-icon" className={className} />
}));

// Mock Supabase
vi.mock('../../api-services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn()
                }))
            }))
        }))
    }
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams('session_id=sess_123');

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [mockSearchParams, vi.fn()]
    };
});

describe('BookingSuccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams('session_id=sess_123');
    });

    const renderBookingSuccess = (sessionId: string | null = 'sess_123') => {
        const params = sessionId ? `?session_id=${sessionId}` : '';
        return render(
            <MemoryRouter initialEntries={[`/booking/success${params}`]}>
                <Routes>
                    <Route path="/booking/success" element={<BookingSuccess />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('redirects to home if no session_id is provided', async () => {
        mockSearchParams = new URLSearchParams('');
        
        renderBookingSuccess(null);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows loading state initially', async () => {
        // Mock a slow response
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => new Promise(() => {})) // Never resolves
                }))
            }))
        } as any);

        renderBookingSuccess('sess_123');

        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
        expect(screen.getByText(/Verifying your payment/)).toBeInTheDocument();
    });

    it('shows success state when booking is confirmed', async () => {
        const mockBooking = {
            id: 'BOOKING123',
            status: 'confirmed',
            payment_status: 'paid',
            check_in: '2026-04-01',
            check_out: '2026-04-05',
            total_price: 500
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
                }))
            }))
        } as any);

        renderBookingSuccess('sess_123');

        await waitFor(() => {
            expect(screen.getByText('booking.success.title')).toBeInTheDocument();
            expect(screen.getByText('BOOKING1')).toBeInTheDocument(); // first 8 chars
            expect(screen.getByText(/€500\.00/)).toBeInTheDocument();
            expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
        });
    });

    it('shows error state when booking status is not confirmed', async () => {
        const mockBooking = {
            id: 'BOOKING123',
            status: 'pending',
            payment_status: 'pending',
            check_in: '2026-04-01',
            check_out: '2026-04-05',
            total_price: 500
        };

        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
                }))
            }))
        } as any);

        renderBookingSuccess('sess_123');

        await waitFor(() => {
            expect(screen.getByText('Payment Pending')).toBeInTheDocument();
            expect(screen.getByText(/Your payment is being processed/)).toBeInTheDocument();
            expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
        });
    });

    it('redirects to home if booking is not found', async () => {
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                }))
            }))
        } as any);

        renderBookingSuccess('sess_123');

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});
