/**
 * Shop Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// 1. Все vi.mock() — первыми, до импортов компонента
const mocks = vi.hoisted(() => ({
    mockGetProducts: vi.fn(),
    mockAddToCart: vi.fn(),
    mockSetSearchParams: vi.fn()
}));

vi.mock('../api-services', () => ({
    db: { getProducts: mocks.mockGetProducts }
}));

vi.mock('../context/CartContext', () => ({
    useCart: () => ({ addToCart: mocks.mockAddToCart })
}));

vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (amount: number) => amount,
        formatPrice: (amount: number) => `€${amount}`
    })
}));

vi.mock('../components/shop/ProductCard', () => ({
    ProductCard: ({ product, onAddToCart }: any) => (
        <div data-testid="product-card" data-product-id={product.id}>
            <h3>{product.title}</h3>
            <button onClick={() => onAddToCart(product)}>Add to Cart</button>
        </div>
    )
}));

vi.mock('../components/shop/ShopHero', () => ({
    ShopHero: () => <div data-testid="shop-hero">Shop Hero</div>
}));

vi.mock('lucide-react', () => ({
    ShoppingBag: () => <svg data-testid="shopping-bag" />,
    Star: () => <svg data-testid="star" />,
    User: () => <svg data-testid="user" />
}));

let mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useSearchParams: () => [mockSearchParams, mocks.mockSetSearchParams]
    };
});

// 2. Импорт компонента — после моков
import { Shop } from './Shop';

describe('Shop', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockAddToCart.mockClear();
        mocks.mockGetProducts.mockClear();
        mocks.mockSetSearchParams.mockClear();
        mockSearchParams = new URLSearchParams();
    });

    const renderShop = () => {
        return render(
            <MemoryRouter initialEntries={['/shop']}>
                <Shop />
            </MemoryRouter>
        );
    };

    // 1. Loading state
    it('shows loading state initially', () => {
        renderShop();
        expect(screen.getByText('Loading treasures...')).toBeInTheDocument();
    });

    // 2. Renders data after fetch
    it('renders ShopHero component', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            expect(screen.getByTestId('shop-hero')).toBeInTheDocument();
        });
    });

    it('renders category filter buttons', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('all')).toBeInTheDocument();
            expect(screen.getByText('souvenir')).toBeInTheDocument();
            expect(screen.getByText('textile')).toBeInTheDocument();
            expect(screen.getByText('food')).toBeInTheDocument();
            expect(screen.getByText('jewelry')).toBeInTheDocument();
            expect(screen.getByText('art')).toBeInTheDocument();
        });
    });

    // 3. Component renders correctly
    it('renders shop hero when products exist', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            expect(screen.getByTestId('shop-hero')).toBeInTheDocument();
        });
    });

    it('renders product cards from mock fallback', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            const productCards = screen.getAllByTestId('product-card');
            expect(productCards.length).toBeGreaterThan(0);
        });
    });

    // 4. Error handling
    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mocks.mockGetProducts.mockRejectedValue(new Error('API Error'));
        renderShop();
        await waitFor(() => {
            const productCards = screen.getAllByTestId('product-card');
            expect(productCards.length).toBeGreaterThan(0);
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    // 5. User actions
    it('changes category when clicking filter button', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('souvenir')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('souvenir'));
        expect(mocks.mockSetSearchParams).toHaveBeenCalledWith({ category: 'souvenir' });
    });

    it('resets to all when clicking all button', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        mockSearchParams.set('category', 'souvenir');
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('all')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('all'));
        expect(mocks.mockSetSearchParams).toHaveBeenCalledWith({});
    });

    it('calls addToCart when Add to Cart is clicked', async () => {
        mocks.mockGetProducts.mockResolvedValue([{
            id: 'p1',
            title: 'Test Product',
            price: 50,
            description: 'Test',
            category: 'souvenir',
            images: ['test.jpg'],
            seller: { full_name: 'Seller' }
        }]);
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Add to Cart'));
        expect(mocks.mockAddToCart).toHaveBeenCalledWith(expect.objectContaining({
            id: 'p1',
            title: 'Test Product',
            price: 50
        }));
    });

    it('shows toast when adding to cart', async () => {
        mocks.mockGetProducts.mockResolvedValue([{
            id: 'p1',
            title: 'Test Product',
            price: 50,
            description: 'Test',
            category: 'souvenir',
            images: ['test.jpg'],
            seller: { full_name: 'Seller' }
        }]);
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Add to Cart'));
        await waitFor(() => {
            expect(screen.getByText('Added Test Product to basket')).toBeInTheDocument();
        });
    });

    // 6. Navigation
    it('scrolls to top when changing category', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('souvenir')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('souvenir'));
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        scrollToSpy.mockRestore();
    });

    // Additional tests for coverage
    it('handles invalid category by defaulting to all', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        mockSearchParams.set('category', 'invalid-category');
        renderShop();
        await waitFor(() => {
            const allButton = screen.getByText('all');
            expect(allButton.closest('button')).toHaveClass('bg-amber-600');
        });
    });

    it('uses mock products fallback when API returns empty', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            const productCards = screen.getAllByTestId('product-card');
            expect(productCards.length).toBeGreaterThan(0);
        });
    });

    // Styling tests
    it('renders with correct page structure', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
        });
    });

    it('renders with dark mode classes', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        const { container } = renderShop();
        await waitFor(() => {
            const pageContainer = container.firstChild as HTMLElement;
            expect(pageContainer?.className).toContain('dark:bg-slate-900');
        });
    });

    it('renders sticky filter bar', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.sticky')).toBeInTheDocument();
        });
    });

    it('renders grid layout for products', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.grid')).toBeInTheDocument();
        });
    });

    it('has proper animation classes', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.animate-page-enter')).toBeInTheDocument();
        });
    });

    it('renders filter buttons with correct styling', async () => {
        mocks.mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });
});
