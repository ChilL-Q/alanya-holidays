import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditPropertyPage } from './AdminEditPropertyPage';

vi.mock('../../api-services', () => ({
    db: {
        getProperty: vi.fn(),
        updateProperty: vi.fn(),
        uploadPropertyImage: vi.fn()
    }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { role: 'admin' }, isLoading: false })
}));

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('../../components/host/AvailabilityCalendar', () => ({
    AvailabilityCalendar: () => <div data-testid="mock-calendar" />
}));

vi.mock('../../components/host/ICalManager', () => ({
    ICalManager: () => <div data-testid="mock-ical" />
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'new' })
    };
});

describe('AdminEditPropertyPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders new property form and tabs', () => {
        render(
            <BrowserRouter>
                <AdminEditPropertyPage />
            </BrowserRouter>
        );

        expect(screen.getByText('admin_prop.edit_title')).toBeInTheDocument();
        expect(screen.getByText('admin_prop.tab_details')).toBeInTheDocument();
        expect(screen.getByText('admin_prop.tab_calendar')).toBeInTheDocument();
        
        // Form field should be present
        expect(screen.getByText('prop_form.label_title')).toBeInTheDocument();
    });

    it('switches to calendar tab', () => {
        render(
            <BrowserRouter>
                <AdminEditPropertyPage />
            </BrowserRouter>
        );

        const calendarBtn = screen.getByText('admin_prop.tab_calendar');
        fireEvent.click(calendarBtn);
        
        expect(screen.queryByText('prop_form.label_title')).not.toBeInTheDocument();
    });
});
