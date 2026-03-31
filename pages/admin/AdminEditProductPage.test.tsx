import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminEditProductPage } from './AdminEditProductPage';
import { db } from '../../api-services';

let mockParams: { id?: string } = {};
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
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

vi.mock('../../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (k: string) => k })
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { role: 'admin', id: '123' }, isLoading: false })
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

vi.mock('../../hooks/useSaveShortcut', () => ({
    useSaveShortcut: vi.fn()
}));

const renderPage = () =>
    render(<BrowserRouter><AdminEditProductPage /></BrowserRouter>);

describe('AdminEditProductPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockParams = {};
    });

    it('renders the product editor form', () => {
        renderPage();
        expect(screen.getByText('Product Details')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Photos')).toBeInTheDocument();
    });

    it('shows "New Product" title when no id provided', () => {
        mockParams = {};
        renderPage();
        expect(screen.getByText('New Product')).toBeInTheDocument();
    });

    it('shows "Edit Product" title when id is provided', async () => {
        mockParams = { id: 'prod-1' };
        (db.getProduct as any).mockResolvedValue({
            title: 'Test Product', description: 'A desc',
            price: 50, stock: 10, category: 'souvenir', images: []
        });
        await act(async () => { renderPage(); });
        await waitFor(() => {
            expect(screen.getByText('Edit Product')).toBeInTheDocument();
        });
    });

    it('calls getProduct when editing', async () => {
        mockParams = { id: 'prod-1' };
        (db.getProduct as any).mockResolvedValue({
            title: 'My Item', description: 'Desc',
            price: 25, stock: 5, category: 'souvenir', images: []
        });
        await act(async () => { renderPage(); });
        await waitFor(() => {
            expect(db.getProduct).toHaveBeenCalledWith('prod-1');
        });
    });

    it('navigates back to /admin/products on back button click', () => {
        mockParams = {};
        renderPage();
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
    });

    it('calls createProduct on save when creating new product', async () => {
        mockParams = {};
        (db.createProduct as any).mockResolvedValue({});
        await act(async () => { renderPage(); });
        const saveBtn = screen.getByText('Save');
        await act(async () => { fireEvent.click(saveBtn); });
        await waitFor(() => {
            expect(db.createProduct).toHaveBeenCalled();
        });
    });

    it('calls updateProduct on save when editing existing product', async () => {
        mockParams = { id: 'prod-1' };
        (db.getProduct as any).mockResolvedValue({
            title: 'My Item', description: 'Desc',
            price: 25, stock: 5, category: 'souvenir', images: []
        });
        (db.updateProduct as any).mockResolvedValue({});
        await act(async () => { renderPage(); });
        await waitFor(() => { expect(db.getProduct).toHaveBeenCalled(); });
        const saveBtn = screen.getByText('Save');
        await act(async () => { fireEvent.click(saveBtn); });
        await waitFor(() => {
            expect(db.updateProduct).toHaveBeenCalledWith('prod-1', expect.any(Object));
        });
    });
});
