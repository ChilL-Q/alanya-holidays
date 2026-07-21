import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Rule 1 & 2: Standard mocks
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    servicesService: {
        getAdminServices: vi.fn(),
        getPendingServiceEdits: vi.fn(),
        approveService: vi.fn(),
        updateServiceStatus: vi.fn(),
        deleteService: vi.fn()
    }
}));

// Mock subcomponents
vi.mock('../../components/admin/services/ServiceToolbar', () => ({
    ServiceToolbar: ({ onFilterStatus, onSearchQuery }: any) => (
        <div data-testid="service-toolbar">
            <button onClick={() => onFilterStatus('approved')}>Filter Approved</button>
            <input placeholder="Search services..." onChange={(e) => onSearchQuery(e.target.value)} />
        </div>
    )
}));

vi.mock('../../components/admin/services/ServiceTable', () => ({
    ServiceTable: ({ loading, services, onAction, toggleSelect, selectedIds, toggleSelectAll }: any) => (
        <div data-testid="service-table">
            <button onClick={toggleSelectAll}>Select All</button>
            {loading ? (
                <span>Loading...</span>
            ) : (
                services.map((s: any) => (
                    <div key={s.id}>
                        <input 
                            type="checkbox" 
                            checked={selectedIds.has(s.id)} 
                            onChange={() => toggleSelect(s.id)} 
                            data-testid={`select-${s.id}`}
                        />
                        <span>{s.title}</span>
                        <button onClick={() => onAction('approve', s.id, s.title)}>Approve</button>
                        <button onClick={() => onAction('reject', s.id, s.title)}>Reject</button>
                        <button onClick={() => onAction('delete', s.id, s.title)}>Delete</button>
                    </div>
                ))
            )}
        </div>
    )
}));

vi.mock('../../components/ui/ConfirmationModal', () => ({
    ConfirmationModal: ({ isOpen, onConfirm, onClose, title }: any) => isOpen ? (
        <div data-testid="confirmation-modal">
            <h2>{title}</h2>
            <button onClick={() => onConfirm('Test Reason')}>Confirm</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    ) : null
}));

// Import component after mocks
import { ServicesPage } from './ServicesPage';
import { servicesService } from '../../api-services';

describe('Admin ServicesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('alert', vi.fn());
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockServices = [
        { id: '1', title: 'Car Rental', status: 'approved', type: 'car' },
        { id: '2', title: 'Boat Trip', status: 'pending', type: 'tour' }
    ];

    const renderServicesPage = (props = {}) => {
        return render(
            <MemoryRouter>
                <ServicesPage {...props} />
            </MemoryRouter>
        );
    };

    it('shows loading state initially', () => {
        (servicesService.getAdminServices as any).mockReturnValue(new Promise(() => {}));
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        renderServicesPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders services table after fetch', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        renderServicesPage();

        await waitFor(() => {
            expect(screen.getByText('Car Rental')).toBeInTheDocument();
            expect(screen.getByText('Boat Trip')).toBeInTheDocument();
        });
    });

    it('handles approve action', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        (servicesService.approveService as any).mockResolvedValue({});
        
        renderServicesPage();

        await waitFor(() => expect(screen.getByText('Car Rental')).toBeInTheDocument());

        const approveBtns = screen.getAllByText('Approve');
        fireEvent.click(approveBtns[0]);

        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
        expect(screen.getByText('Approve Service')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(servicesService.approveService).toHaveBeenCalledWith('1');
        });
    });

    it('handles bulk approve action', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        (servicesService.approveService as any).mockResolvedValue({});

        renderServicesPage();

        await waitFor(() => expect(screen.getByText('Car Rental')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Select All'));

        const bulkApproveBtn = screen.getByText('Approve Selected');
        fireEvent.click(bulkApproveBtn);

        await waitFor(() => {
            expect(servicesService.approveService).toHaveBeenCalledTimes(2);
        });
    });

    it('filters services by search query', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        renderServicesPage();

        await waitFor(() => expect(screen.getByText('Car Rental')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search services...');
        fireEvent.change(searchInput, { target: { value: 'boat' } });

        expect(screen.queryByText('Car Rental')).not.toBeInTheDocument();
        expect(screen.getByText('Boat Trip')).toBeInTheDocument();
    });

    it('handles bulk delete action', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        (servicesService.deleteService as any).mockResolvedValue({});

        renderServicesPage();

        await waitFor(() => expect(screen.getByText('Car Rental')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Select All'));

        const deleteBtns = screen.getAllByText('Delete');
        const bulkDeleteBtn = deleteBtns.find(btn => btn.className.includes('bg-red-100')) || deleteBtns[0];
        fireEvent.click(bulkDeleteBtn);

        // Bulk delete now opens ConfirmationModal instead of window.confirm
        await waitFor(() => {
            expect(screen.getByText(/Delete 2 Services/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(servicesService.deleteService).toHaveBeenCalledTimes(2);
            expect(servicesService.deleteService).toHaveBeenCalledWith('1', 'Test Reason');
            expect(servicesService.deleteService).toHaveBeenCalledWith('2', 'Test Reason');
        });
    });

    it('handles bulk reject action', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        (servicesService.updateServiceStatus as any).mockResolvedValue({});

        renderServicesPage();

        await waitFor(() => expect(screen.getByText('Car Rental')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Select All'));

        const bulkRejectBtn = screen.getByText('Reject Selected');
        fireEvent.click(bulkRejectBtn);

        // Bulk reject now opens ConfirmationModal instead of window.confirm
        await waitFor(() => {
            expect(screen.getByText(/Reject 2 Services/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(servicesService.updateServiceStatus).toHaveBeenCalledTimes(2);
            expect(servicesService.updateServiceStatus).toHaveBeenCalledWith('1', 'rejected', 'Test Reason');
            expect(servicesService.updateServiceStatus).toHaveBeenCalledWith('2', 'rejected', 'Test Reason');
        });
    });

    it('renders with different type props (fleet)', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: [] });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        
        renderServicesPage({ type: 'fleet' });

        await waitFor(() => {
            expect(servicesService.getAdminServices).toHaveBeenCalledWith(
                'all', 
                ['car', 'bike', 'transfer'], 
                1, 
                100
            );
        });
    });

    it('renders with different type props (services)', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: [] });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        
        renderServicesPage({ type: 'services' });

        await waitFor(() => {
            expect(servicesService.getAdminServices).toHaveBeenCalledWith(
                'all', 
                ['tour', 'wellness', 'creative', 'visa', 'esim'], 
                1, 
                100
            );
        });
    });

    it('handles reject action from table', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        (servicesService.updateServiceStatus as any).mockResolvedValue({});
        
        renderServicesPage();

        await waitFor(() => expect(screen.getByText('Car Rental')).toBeInTheDocument());

        const rejectBtns = screen.getAllByText('Reject');
        // Filter out bulk reject button
        const tableRejectBtn = rejectBtns.find(btn => !btn.className.includes('bg-amber-100')) || rejectBtns[0];
        fireEvent.click(tableRejectBtn);

        expect(screen.getByText('Reject Service')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(servicesService.updateServiceStatus).toHaveBeenCalledWith('1', 'rejected', 'Test Reason');
        });
    });

    it('handles delete action from table', async () => {
        (servicesService.getAdminServices as any).mockResolvedValue({ data: mockServices });
        (servicesService.getPendingServiceEdits as any).mockResolvedValue([]);
        (servicesService.deleteService as any).mockResolvedValue({});
        
        renderServicesPage();

        await waitFor(() => expect(screen.getByText('Car Rental')).toBeInTheDocument());

        const deleteBtns = screen.getAllByText('Delete');
        // Filter out bulk delete button
        const tableDeleteBtn = deleteBtns.find(btn => !btn.className.includes('bg-red-100')) || deleteBtns[0];
        fireEvent.click(tableDeleteBtn);

        expect(screen.getByText('Delete Service')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(servicesService.deleteService).toHaveBeenCalledWith('1', 'Test Reason');
        });
    });
});
