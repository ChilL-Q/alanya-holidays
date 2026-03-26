import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsPage } from './ProductsPage';
import { CurrencyProvider } from '../../context/CurrencyContext';

vi.mock('../../api-services', () => ({
    db: {
        getProducts: vi.fn(),
        deleteProduct: vi.fn()
    }
}));

describe('ProductsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the product list with toolbar components', async () => {
        render(
            <BrowserRouter>
                <CurrencyProvider>
                    <ProductsPage />
                </CurrencyProvider>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
        expect(screen.getByText('Add Product')).toBeInTheDocument();
        expect(screen.getByText('Product')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Artisan')).toBeInTheDocument();
    });
});
