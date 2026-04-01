import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditProductPage } from './AdminEditProductPage';
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
        useParams: () => mockParams,
    };
});

vi.mock('../../api-services', () => ({
    db: {
        getProduct: vi.fn(),
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        uploadImage: vi.fn().mockResolvedValue('http://example.com/img.jpg'),
    }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { role: 'admin', id: '123' }, isLoading: false })
}));

vi.mock('react-hot-toast', () => ({
    default: mockToast,
}));

vi.mock('../../hooks/useSaveShortcut', () => ({
    useSaveShortcut: vi.fn()
}));

const mockProduct = {
    id: 'prod-1',
    title: 'Test Product',
    description: 'Beautiful souvenir',
    price: 50,
    stock: 10,
    category: 'souvenir',
    images: ['img1.jpg']
};

describe('AdminEditProductPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockParams.id = 'new';
    });

    const renderPage = (id = 'new') => {
        mockParams.id = id;
        const path = id === 'new' ? '/admin/products/new' : `/admin/products/${id}`;
        return render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/admin/products/:id" element={<AdminEditProductPage />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders the product editor form', () => {
        renderPage();
        expect(screen.getByText('Product Details')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Photos')).toBeInTheDocument();
    });

    it('shows "New Product" title when no id provided', () => {
        renderPage();
        expect(screen.getByText('New Product')).toBeInTheDocument();
    });

    it('loads and renders existing product', async () => {
        (db.getProduct as any).mockResolvedValue(mockProduct);
        renderPage('prod-1');

        await waitFor(() => {
            expect(db.getProduct).toHaveBeenCalledWith('prod-1');
            expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
            expect(screen.getByDisplayValue('50')).toBeInTheDocument();
        });
    });

    it('handles load failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getProduct as any).mockRejectedValue(new Error('Fetch failed'));
        
        renderPage('prod-1');

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to load product');
            expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
        });
        consoleSpy.mockRestore();
    });

    it('submits new product successfully', async () => {
        (db.createProduct as any).mockResolvedValue({});
        
        renderPage();

        fireEvent.change(screen.getByLabelText(/Title/i), { target: { name: 'title', value: 'Cool Souvenir' } });
        fireEvent.change(screen.getByLabelText(/Price/i), { target: { name: 'price', value: '30' } });

        const saveBtn = screen.getByRole('button', { name: /Save/i });
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(db.createProduct).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Cool Souvenir',
            price: 30
        }));
        expect(mockToast.success).toHaveBeenCalledWith('Product created successfully');
        expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
    });

    it('updates existing product successfully', async () => {
        (db.getProduct as any).mockResolvedValue(mockProduct);
        (db.updateProduct as any).mockResolvedValue({});
        
        renderPage('prod-1');

        await waitFor(() => expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Title/i), { target: { name: 'title', value: 'Updated Title' } });

        const saveBtn = screen.getByRole('button', { name: /Save/i });
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(db.updateProduct).toHaveBeenCalledWith('prod-1', expect.objectContaining({
            title: 'Updated Title'
        }));
        expect(mockToast.success).toHaveBeenCalledWith('Product updated successfully');
    });

    it('handles form submission error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.createProduct as any).mockRejectedValue(new Error('Save failed'));
        
        renderPage();

        fireEvent.change(screen.getByLabelText(/Title/i), { target: { name: 'title', value: 'Bad Product' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save/i }));
        });

        expect(mockToast.error).toHaveBeenCalledWith('Save failed');
        consoleSpy.mockRestore();
    });

    it('handles photo upload during submit', async () => {
        (db.createProduct as any).mockResolvedValue({});
        (db.uploadImage as any).mockResolvedValue('http://example.com/new.jpg');
        
        renderPage();

        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        // The PhotoUploader is inside ProductMediaForm.
        // Let's find the hidden input.
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        
        await act(async () => {
            fireEvent.change(input, { target: { files: [file] } });
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save/i }));
        });

        expect(db.uploadImage).toHaveBeenCalledWith(file, 'products');
        expect(db.createProduct).toHaveBeenCalledWith(expect.objectContaining({
            images: expect.arrayContaining(['http://example.com/new.jpg'])
        }));
    });

    it('removes existing image', async () => {
        (db.getProduct as any).mockResolvedValue(mockProduct);
        renderPage('prod-1');

        await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument());

        const removeBtn = screen.getByTitle('Remove image');
        fireEvent.click(removeBtn);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
