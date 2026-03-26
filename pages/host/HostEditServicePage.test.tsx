import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HostEditServicePage } from './HostEditServicePage';
import { db } from '../../api-services';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'host-1', full_name: 'Test Host', role: 'host' },
        isAuthenticated: true
    })
}));

vi.mock('../../api-services', () => ({
    db: {
        getService: vi.fn(),
        updateService: vi.fn(),
        requestServiceUpdate: vi.fn()
    }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useParams: () => ({ id: 'service-1' }),
        useNavigate: () => mockNavigate
    };
});

vi.mock('../../components/ui/PhotoUploader', () => ({
    PhotoUploader: () => <div data-testid="photo-uploader-mock">Photo Uploader</div>
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../../hooks/useSaveShortcut', () => ({
    useSaveShortcut: vi.fn()
}));

describe('HostEditServicePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders service details after loading', async () => {
        (db.getService as any).mockResolvedValue({
            id: 'service-1',
            type: 'car',
            title: 'Test Car',
            price: 50,
            features: {
                brand: 'Ford',
                model: 'Mustang'
            }
        });

        await act(async () => {
            render(
                <BrowserRouter>
                    <HostEditServicePage />
                </BrowserRouter>
            );
        });

        await waitFor(() => {
            expect(db.getService).toHaveBeenCalledWith('service-1');
        });

        expect(screen.getByDisplayValue('Test Car')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Ford')).toBeInTheDocument();
        expect(screen.getByText('Submit Changes')).toBeInTheDocument();
    });
});
