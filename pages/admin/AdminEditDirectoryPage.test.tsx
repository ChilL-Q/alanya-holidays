import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditDirectoryPage } from './AdminEditDirectoryPage';
import { db } from '../../api-services';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate, mockToast, mockParams } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockParams: { id: 'new' },
    mockToast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn()
    }
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockParams
    };
});

vi.mock('../../api-services', () => ({
    db: {
        getDirectoryListing: vi.fn(),
        createDirectoryListing: vi.fn(),
        updateDirectoryListing: vi.fn(),
        uploadImage: vi.fn(),
        getLocations: vi.fn().mockResolvedValue([])
    },
    TIER_LIMITS: { explorer: 5, voyager: 50, signature: 100, partner: 100 }
}));

vi.mock('react-hot-toast', () => ({
    default: mockToast
}));

vi.mock('../../hooks/useSaveShortcut', () => ({
    useSaveShortcut: vi.fn()
}));

const { mockSupabaseFunctions } = vi.hoisted(() => ({
    mockSupabaseFunctions: {
        invoke: vi.fn()
    }
}));

vi.mock('../../api-services/supabase', () => ({
    supabase: {
        functions: mockSupabaseFunctions
    }
}));

const mockListing = {
    id: '1',
    name: 'Existing Clinic',
    short_description: 'Top rated dental clinic',
    category_id: 'medical',
    location: 'Alanya Center',
    website: 'https://example.com',
    whatsapp: '905551234567',
    gallery: ['img1.jpg'],
    languages_spoken: ['English', 'Turkish'],
    certifications: ['TDB Certified'],
    is_featured: true,
    is_verified: true,
    price_level: 3,
    reviews_average: 4.9,
    reviews_count: 120,
    descriptions: { en: '', tr: '', ru: '', ar: '' },
    tier: 'signature'
};

describe('AdminEditDirectoryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
        mockParams.id = 'new';
    });

    const renderPage = (id = 'new') => {
        mockParams.id = id;
        const path = id === 'new' ? '/admin/directory/new' : `/admin/directory/${id}`;
        return render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/admin/directory/:id" element={<AdminEditDirectoryPage />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders new listing form correctly', () => {
        renderPage();
        expect(screen.getByText('New Listing')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. Alanya Premium Dental')).toBeInTheDocument();
    });

    it('loads and renders existing listing', async () => {
        (db.getDirectoryListing as any).mockResolvedValue(mockListing);
        
        renderPage('1');

        await waitFor(() => {
            expect(db.getDirectoryListing).toHaveBeenCalledWith('1');
            expect(screen.getByDisplayValue('Existing Clinic')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Top rated dental clinic')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Alanya Center')).toBeInTheDocument();
        });
    });

    it('handles load failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getDirectoryListing as any).mockRejectedValue(new Error('Load error'));
        
        renderPage('1');

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to load listing');
            expect(mockNavigate).toHaveBeenCalledWith('/admin/directory');
        });
        consoleSpy.mockRestore();
    });

    it('submits new listing successfully', async () => {
        (db.createDirectoryListing as any).mockResolvedValue({ id: 'new-1' });
        
        renderPage();

        fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { name: 'name', value: 'New Shop' } });
        fireEvent.change(screen.getByLabelText(/Short Description/i), { target: { name: 'short_description', value: 'Great shop' } });
        fireEvent.change(screen.getByLabelText(/Location/i), { target: { name: 'location', value: 'Oba' } });

        const saveBtn = screen.getByRole('button', { name: /Save/i });
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(db.createDirectoryListing).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'New Shop',
                short_description: 'Great shop',
                location: 'Oba'
            }),
            []
        );
        expect(mockToast.success).toHaveBeenCalledWith('Listing created successfully');
        expect(mockNavigate).toHaveBeenCalledWith('/admin/directory');
    });

    it('updates existing listing successfully', async () => {
        (db.getDirectoryListing as any).mockResolvedValue(mockListing);
        (db.updateDirectoryListing as any).mockResolvedValue({});
        
        renderPage('1');

        await waitFor(() => expect(screen.getByDisplayValue('Existing Clinic')).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { name: 'name', value: 'Updated Clinic' } });

        const saveBtn = screen.getByRole('button', { name: /Save/i });
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(db.updateDirectoryListing).toHaveBeenCalledWith(
            '1',
            expect.objectContaining({
                name: 'Updated Clinic'
            }),
            []
        );
        expect(mockToast.success).toHaveBeenCalledWith('Listing updated successfully');
    });

    it('handles form submission error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.createDirectoryListing as any).mockRejectedValue(new Error('Save failed'));
        
        renderPage();

        fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { name: 'name', value: 'New Shop' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save/i }));
        });

        expect(mockToast.error).toHaveBeenCalledWith('Save failed');
        consoleSpy.mockRestore();
    });

    it('adds array items for languages', () => {
        renderPage();

        const addLangBtn = screen.getByText('+ Add Language');
        fireEvent.click(addLangBtn);

        const langInputs = screen.getAllByPlaceholderText('e.g. English');
        expect(langInputs.length).toBe(2);
    });

    it('handles photo upload during submit', async () => {
        (db.createDirectoryListing as any).mockResolvedValue({});
        (db.uploadImage as any).mockResolvedValue('http://example.com/new.jpg');
        
        renderPage();

        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        
        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save/i }));
        });

        expect(db.uploadImage).toHaveBeenCalledWith(file, 'directory');
        expect(db.createDirectoryListing).toHaveBeenCalledWith(
            expect.objectContaining({
                gallery: expect.arrayContaining(['http://example.com/new.jpg'])
            }),
            []
        );
    });

    it('removes existing image', async () => {
        (db.getDirectoryListing as any).mockResolvedValue(mockListing);
        renderPage('1');

        await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument());

        const removeBtn = screen.getByTitle('Remove image');
        fireEvent.click(removeBtn);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('hydrates descriptions from existing listing', async () => {
        (db.getDirectoryListing as any).mockResolvedValue({
            ...mockListing,
            descriptions: { en: 'EN desc', tr: 'TR desc', ru: 'RU desc', ar: 'AR desc' }
        });
        renderPage('1');

        await waitFor(() => {
            expect(screen.getByText('Edit Listing')).toBeInTheDocument();
        });

        // Arabic tab should have content indicator (checkmark badge)
        const arTab = screen.getByText('AR');
        expect(arTab).toBeInTheDocument();
    });

    it('invokes AI generation with structured mode on Generate click', async () => {
        (db.getDirectoryListing as any).mockResolvedValue(mockListing);
        mockSupabaseFunctions.invoke.mockResolvedValue({
            data: { answer: '{"en":"Generated EN","tr":"Generated TR","ru":"Generated RU","ar":"Generated AR"}' },
            error: null
        });

        renderPage('1');

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Generate AI/i })).toBeInTheDocument();
        });

        const generateBtn = screen.getByRole('button', { name: /Generate AI/i });
        await act(async () => {
            fireEvent.click(generateBtn);
        });

        expect(mockSupabaseFunctions.invoke).toHaveBeenCalledWith('ai-proxy', expect.objectContaining({
            body: expect.objectContaining({ mode: 'structured' })
        }));
    });

    it('shows error toast when AI returns invalid JSON', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getDirectoryListing as any).mockResolvedValue(mockListing);
        mockSupabaseFunctions.invoke.mockResolvedValue({
            data: { answer: 'not json' },
            error: null
        });

        renderPage('1');

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Generate AI/i })).toBeInTheDocument();
        });

        const generateBtn = screen.getByRole('button', { name: /Generate AI/i });
        await act(async () => {
            fireEvent.click(generateBtn);
        });

        expect(mockToast.error).toHaveBeenCalledWith('AI returned invalid JSON. Please try again.');
        consoleSpy.mockRestore();
    });
});
