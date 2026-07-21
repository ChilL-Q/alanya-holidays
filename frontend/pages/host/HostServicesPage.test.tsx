import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HostServicesPage } from './HostServicesPage';
import { BrowserRouter } from 'react-router-dom';
import { db } from '../../api-services';
import { useAuth } from '../../context/AuthContext';

// Mock dependencies
vi.mock('../../api-services', () => ({
    db: {
        getServicesByProvider: vi.fn(),
        getMyPendingEdits: vi.fn(),
        deleteService: vi.fn()
    }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (p: number) => `€${p}`,
        convertPrice: (p: number) => p
    })
}));

describe('HostServicesPage', () => {
    const mockUser = { id: 'user1', email: 'test@test.com' };
    const mockServices = [
        { id: '1', title: 'Car 1', type: 'car', price: 50, status: 'approved' },
        { id: '2', title: 'Car 2', type: 'car', price: 60, status: 'approved' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: mockUser });
        (db.getServicesByProvider as any).mockResolvedValue(mockServices);
        (db.getMyPendingEdits as any).mockResolvedValue([]);
    });

    it('renders services list', async () => {
        render(
            <BrowserRouter>
                <HostServicesPage mode="fleet" />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Car 1')).toBeInTheDocument();
            expect(screen.getByText('Car 2')).toBeInTheDocument();
        });
    });

    it('allows bulk selection and deletion', async () => {
        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);

        render(
            <BrowserRouter>
                <HostServicesPage mode="fleet" />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Car 1')).toBeInTheDocument();
        });

        // Select all
        const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(selectAllCheckbox);

        // Check if bulk actions appear
        await waitFor(() => {
            expect(screen.getByText('2 services selected')).toBeInTheDocument();
        });

        // Click delete
        const deleteButton = screen.getByText('Delete Selected');
        fireEvent.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalled();
        await waitFor(() => {
            expect(db.deleteService).toHaveBeenCalledTimes(2);
            expect(db.deleteService).toHaveBeenCalledWith('1');
            expect(db.deleteService).toHaveBeenCalledWith('2');
        });
    });
});
