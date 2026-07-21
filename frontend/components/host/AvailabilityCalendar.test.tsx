import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { propertiesService } from '../../api-services';
import toast from 'react-hot-toast';

// Mock DatePicker
vi.mock('react-datepicker', () => {
    return {
        default: vi.fn(({ onChange, renderDayContents, dayClassName }) => {
            const mockDate = new Date();
            return (
                <div data-testid="mock-datepicker">
                    <button
                        data-testid="select-day"
                        onClick={() => onChange(mockDate)}
                        className={dayClassName ? dayClassName(mockDate) : ''}
                    >
                        {renderDayContents ? renderDayContents(mockDate.getDate(), mockDate) : 'Day'}
                    </button>
                    <button
                        data-testid="select-null"
                        onClick={() => onChange(null)}
                    >
                        Null
                    </button>
                </div>
            )
        })
    }
});

vi.mock('../../api-services', () => ({
    db: {
        getPropertyAvailability: vi.fn(),
        getICalFeeds: vi.fn(),
        updatePropertyAvailability: vi.fn(),
    },
    propertiesService: {
        getPropertyAvailability: vi.fn(),
        getICalFeeds: vi.fn(),
        updatePropertyAvailability: vi.fn(),
    }
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (price: number) => `€${price}`,
        currency: 'EUR',
    }),
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('AvailabilityCalendar', () => {
    const propertyId = 'prop-123';
    const mockDateStr = new Date().toLocaleDateString('sv');

    beforeEach(() => {
        vi.clearAllMocks();
        (propertiesService.getPropertyAvailability as any).mockResolvedValue([]);
        (propertiesService.getICalFeeds as any).mockResolvedValue([{ id: 'feed1', name: 'Airbnb' }]);
    });

    it('loads data on mount', async () => {
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });
        expect(propertiesService.getPropertyAvailability).toHaveBeenCalled();
        expect(propertiesService.getICalFeeds).toHaveBeenCalled();
        // Summary instruction should be visible
        expect(screen.getByText('Select dates on the calendar to edit availability or pricing.')).toBeDefined();
    });

    it('shows error toast if loading fails', async () => {
        (propertiesService.getPropertyAvailability as any).mockRejectedValue(new Error('Fetch error'));
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });
        expect(toast.error).toHaveBeenCalledWith('Failed to load calendar data');
    });

    it('can refresh data with button', async () => {
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });

        const refreshBtn = screen.getByTitle('Refresh Calendar');
        await act(async () => {
            fireEvent.click(refreshBtn);
        });

        expect(propertiesService.getPropertyAvailability).toHaveBeenCalledTimes(2);
    });

    it('selects a date, opens panel, and saves availability', async () => {
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });

        // Select a date
        await act(async () => {
            fireEvent.click(screen.getByTestId('select-day'));
        });

        // Panel should show instruction to set status
        expect(screen.getByText('Set status or price for these dates.')).toBeDefined();

        // Select Blocked status
        await act(async () => {
            fireEvent.click(screen.getByText('Blocked'));
        });

        // Save changes
        const saveBtn = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(propertiesService.updatePropertyAvailability).toHaveBeenCalledWith(propertyId, [mockDateStr], 'blocked', undefined);
        expect(toast.success).toHaveBeenCalledWith('Updated 1 dates');
    });

    it('can set a custom price for available dates', async () => {
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-day'));
        });

        // Ensure status is available
        await act(async () => {
            fireEvent.click(screen.getByText('Available'));
        });

        // Find price input and set value
        const priceInput = screen.getByPlaceholderText('Base Price');
        await act(async () => {
            fireEvent.change(priceInput, { target: { value: '150' } });
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Save Changes'));
        });

        expect(propertiesService.updatePropertyAvailability).toHaveBeenCalledWith(propertyId, [mockDateStr], 'available', 150);
    });

    it('deselects a date when clicked twice', async () => {
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-day')); // Select
        });
        expect(screen.getByText('Set status or price for these dates.')).toBeDefined();

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-day')); // Deselect
        });
        // Should return to default instruction
        expect(screen.getByText('Select dates on the calendar to edit availability or pricing.')).toBeDefined();
    });

    it('handles null date safely', async () => {
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-null'));
        });

        // No crash, just ignores it
        expect(screen.getByText('Select dates on the calendar to edit availability or pricing.')).toBeDefined();
    });

    it('shows error if saving fails', async () => {
        (propertiesService.updatePropertyAvailability as any).mockRejectedValue(new Error('Update error'));
        await act(async () => {
            render(<AvailabilityCalendar propertyId={propertyId} />);
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-day'));
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Save Changes'));
        });

        expect(toast.error).toHaveBeenCalledWith('Failed to save changes');
    });

    describe('Panel Summaries & Render Classes based on Availability', () => {
        it('renders blocked manual date and shows correct panel', async () => {
            (propertiesService.getPropertyAvailability as any).mockResolvedValue([
                { date: mockDateStr, status: 'blocked', source: 'manual' }
            ]);

            await act(async () => {
                render(<AvailabilityCalendar propertyId={propertyId} />);
            });

            // Check if day class reflects block
            const dayBtn = screen.getByTestId('select-day');
            expect(dayBtn.className).toContain('bg-slate-200');

            await act(async () => {
                fireEvent.click(dayBtn);
            });

            // Panel shows "Blocked by You"
            expect(screen.getByText('Blocked by You')).toBeDefined();

            // Can unblock
            await act(async () => {
                fireEvent.click(screen.getByText('Unblock these dates'));
            });

            expect(propertiesService.updatePropertyAvailability).toHaveBeenCalledWith(propertyId, [mockDateStr], 'available', undefined);
        });

        it('renders blocked external date and prevents editing', async () => {
            (propertiesService.getPropertyAvailability as any).mockResolvedValue([
                { date: mockDateStr, status: 'blocked', source: 'ical', feed_id: 'feed1' }
            ]);

            await act(async () => {
                render(<AvailabilityCalendar propertyId={propertyId} />);
            });

            const dayBtn = screen.getByTestId('select-day');
            expect(dayBtn.className).toContain('bg-purple-100');

            await act(async () => {
                fireEvent.click(dayBtn);
            });

            // Summary
            expect(screen.getByText('Blocked by Airbnb')).toBeDefined();
            // Should NOT have save button
            expect(screen.queryByText('Save Changes')).toBeNull();
        });

        it('renders custom price date and booked date', async () => {
            // Need a bit of a hack to test two different dates in our simple mock
            // Let's test custom price first
            (propertiesService.getPropertyAvailability as any).mockResolvedValue([
                { date: mockDateStr, status: 'available', price: 999 }
            ]);

            await act(async () => {
                render(<AvailabilityCalendar propertyId={propertyId} />);
            });

            const dayBtn = screen.getByTestId('select-day');
            expect(dayBtn.className).toContain('bg-teal-50');
            // Check if price text is rendered (component strips currency symbols)
            expect(screen.getByText('999')).toBeDefined();
        });

        it('renders booked date', async () => {
            (propertiesService.getPropertyAvailability as any).mockResolvedValue([
                { date: mockDateStr, status: 'booked' }
            ]);

            await act(async () => {
                render(<AvailabilityCalendar propertyId={propertyId} />);
            });

            const dayBtn = screen.getByTestId('select-day');
            expect(dayBtn.className).toContain('bg-rose-100');
        });

        it('can close the edit panel', async () => {
            await act(async () => {
                render(<AvailabilityCalendar propertyId={propertyId} />);
            });

            await act(async () => {
                fireEvent.click(screen.getByTestId('select-day'));
            });

            // We need to avoid the refresh button which also has rounded-full. The close button has p-1.
            const allBtns = screen.getAllByRole('button');
            const closePanelBtn = allBtns.find(btn => btn.className.includes('rounded-full') && btn.className.includes('p-1'));

            await act(async () => {
                if (closePanelBtn) fireEvent.click(closePanelBtn);
            });

            expect(screen.getByText('Select dates on the calendar to edit availability or pricing.')).toBeDefined();
        });
    });
});
