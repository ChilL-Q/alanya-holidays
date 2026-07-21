import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { HostCalendarPage } from './HostCalendarPage';
import { useAuth } from '../../context/AuthContext';
import { bookingsService } from '../../api-services';

// Mock Dependencies
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../api-services', () => ({
    bookingsService: {
        getBookingsForHost: vi.fn()
    }
}));

vi.mock('lucide-react', () => ({
    ChevronLeft: ({ className }: any) => <svg data-testid="chevron-left" className={className} />,
    ChevronRight: ({ className }: any) => <svg data-testid="chevron-right" className={className} />
}));

describe('HostCalendarPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Fixed date: March 15, 2026
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the calendar for the current month', async () => {
        (useAuth as any).mockReturnValue({ user: { id: 'host-123' } });
        (bookingsService.getBookingsForHost as any).mockResolvedValue([]);

        await act(async () => {
            render(<HostCalendarPage />);
        });

        // Use more flexible matcher for broken up text
        expect(screen.getByText(/March/i)).toBeInTheDocument();
        expect(screen.getByText(/2026/i)).toBeInTheDocument();
        
        // Use act to process async effects
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(bookingsService.getBookingsForHost).toHaveBeenCalled();
        const callArgs = (bookingsService.getBookingsForHost as any).mock.calls[0];
        expect(callArgs[0]).toBe('host-123');
        expect(typeof callArgs[1]).toBe('string');
        expect(typeof callArgs[2]).toBe('string');
    });

    it('displays booked days with highlights', async () => {
        const mockBookings = [
            {
                id: 'b1',
                check_in: '2026-03-10',
                check_out: '2026-03-12'
            }
        ];
        (useAuth as any).mockReturnValue({ user: { id: 'host-123' } });
        (bookingsService.getBookingsForHost as any).mockResolvedValue(mockBookings);

        await act(async () => {
            render(<HostCalendarPage />);
        });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // Day 10, 11, 12 should have booked styling
        const day10 = screen.getByText('10');
        const day11 = screen.getByText('11');
        const day12 = screen.getByText('12');
        
        expect(day10.closest('div')).toHaveClass('bg-indigo-100');
        expect(day11.closest('div')).toHaveClass('bg-indigo-100');
        expect(day12.closest('div')).toHaveClass('bg-indigo-100');
    });

    it('changes month when clicking navigation arrows', async () => {
        (useAuth as any).mockReturnValue({ user: { id: 'host-123' } });
        (bookingsService.getBookingsForHost as any).mockResolvedValue([]);

        await act(async () => {
            render(<HostCalendarPage />);
        });

        const nextButton = screen.getByTestId('chevron-right').closest('button');
        
        await act(async () => {
            fireEvent.click(nextButton!);
            await vi.runAllTimersAsync();
        });

        expect(screen.getByText(/April/i)).toBeInTheDocument();
        expect(screen.getByText(/2026/i)).toBeInTheDocument();
        
        expect(bookingsService.getBookingsForHost).toHaveBeenCalledTimes(2);

        const prevButton = screen.getByTestId('chevron-left').closest('button');
        await act(async () => {
            fireEvent.click(prevButton!);
            await vi.runAllTimersAsync();
        });
        expect(screen.getByText(/March/i)).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(prevButton!); // February
            await vi.runAllTimersAsync();
        });

        expect(screen.getByText(/February/i)).toBeInTheDocument();
    });

    it('does not load bookings if user is not authenticated', async () => {
        (useAuth as any).mockReturnValue({ user: null });
        
        await act(async () => {
            render(<HostCalendarPage />);
        });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(bookingsService.getBookingsForHost).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (useAuth as any).mockReturnValue({ user: { id: 'host-123' } });
        (bookingsService.getBookingsForHost as any).mockRejectedValue(new Error('API Failure'));

        await act(async () => {
            render(<HostCalendarPage />);
        });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('renders legendary indicators for Available and Booked', async () => {
        (useAuth as any).mockReturnValue({ user: { id: 'host-123' } });
        
        await act(async () => {
            render(<HostCalendarPage />);
        });

        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Booked')).toBeInTheDocument();
    });
});
