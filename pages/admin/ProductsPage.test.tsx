import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Rule 3: API mocks
vi.mock('../../api-services', () => ({
    db: {
        getProducts: vi.fn(),
        deleteProduct: vi.fn()
    }
}));

// Mock subcomponents to avoid deep rendering issues
vi.mock('../../components/admin/products/ProductToolbar', () => ({
    ProductToolbar: ({ onFilterCategory, onSearchQuery }: any) => (
        <div data-testid="product-toolbar">
            <button onClick={() => onFilterCategory('electronics')}>Filter Electronics</button>
            <input placeholder="Search products..." onChange={(e) => onSearchQuery(e.target.value)} />
        </div>
    )
}));

vi.mock('../../components/admin/products/ProductTable', () => ({
    ProductTable: ({ loading, products, onDelete }: any) => (
        <div data-testid="product-table">
            {loading ? (
                <span>Loading...</span>
            ) : (
                products.map((p: any) => (
                    <div key={p.id}>
                        <span>{p.title}</span>
                        <button onClick={() => onDelete(p.id, p.title)}>Delete</button>
                    </div>
                ))
            )}
        </div>
    )
}));

vi.mock('react-hot-toast', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
    default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../components/ui/ConfirmationModal', () => ({
    ConfirmationModal: ({ isOpen, onConfirm, onClose, title }: any) => isOpen ? (
        <div data-testid="confirmation-modal">
            <h2>{title}</h2>
            <button onClick={onConfirm}>Confirm</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    ) : null
}));

// Import component after mocks
import { ProductsPage } from './ProductsPage';
import { db } from '../../api-services';

describe('ProductsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockProducts = [
        { id: '1', title: 'Smartphone', category: 'electronics', price: 500 },
        { id: '2', title: 'Laptop', category: 'electronics', price: 1000 },
        { id: '3', title: 'Coffee Maker', category: 'appliances', price: 100 }
    ];

    const renderProductsPage = () => {
        return render(
            <MemoryRouter>
                <ProductsPage />
            </MemoryRouter>
        );
    };

    it('shows loading state initially', () => {
        (db.getProducts as any).mockReturnValue(new Promise(() => {})); 
        renderProductsPage();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders products table after fetch', async () => {
        (db.getProducts as any).mockResolvedValue(mockProducts);
        renderProductsPage();

        await waitFor(() => {
            expect(screen.getByText('Smartphone')).toBeInTheDocument();
            expect(screen.getByText('Laptop')).toBeInTheDocument();
            expect(screen.getByText('Coffee Maker')).toBeInTheDocument();
        });
    });

    it('filters products by category', async () => {
        (db.getProducts as any).mockResolvedValue(mockProducts);
        renderProductsPage();

        await waitFor(() => expect(screen.getByText('Smartphone')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Filter Electronics'));

        expect(screen.getByText('Smartphone')).toBeInTheDocument();
        expect(screen.queryByText('Coffee Maker')).not.toBeInTheDocument();
    });

    it('filters products by search query', async () => {
        (db.getProducts as any).mockResolvedValue(mockProducts);
        renderProductsPage();

        await waitFor(() => expect(screen.getByText('Smartphone')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search products...');
        fireEvent.change(searchInput, { target: { value: 'laptop' } });

        expect(screen.queryByText('Smartphone')).not.toBeInTheDocument();
        expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    it('opens delete confirmation modal and handles confirmation', async () => {
        (db.getProducts as any).mockResolvedValue(mockProducts);
        (db.deleteProduct as any).mockResolvedValue(undefined);
        
        renderProductsPage();

        await waitFor(() => expect(screen.getByText('Smartphone')).toBeInTheDocument());

        const deleteBtns = screen.getAllByText('Delete');
        fireEvent.click(deleteBtns[0]);

        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
        expect(screen.getByText('Delete Product')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(db.deleteProduct).toHaveBeenCalledWith('1');
            expect(db.getProducts).toHaveBeenCalledTimes(2); // Initial + after delete
        });
    });

    it('handles delete error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (db.getProducts as any).mockResolvedValue(mockProducts);
        (db.deleteProduct as any).mockRejectedValue(new Error('Delete failed'));
        
        renderProductsPage();

        await waitFor(() => expect(screen.getByText('Smartphone')).toBeInTheDocument());

        fireEvent.click(screen.getAllByText('Delete')[0]);
        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        const { toast } = await import('react-hot-toast');
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete product'));
        consoleSpy.mockRestore();
    });
});
