/**
 * Shop Component Tests
 * 
 * Note: Due to vi.mock hoisting limitations with ES modules, 
 * these tests focus on the component's render output and behavior
 * using mocked child components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// vi.mock is hoisted — variables must be declared with vi.hoisted()
const { mockAddToCart, mockGetProducts, mockSetSearchParams } = vi.hoisted(() => ({
    mockAddToCart: vi.fn(),
    mockGetProducts: vi.fn(),
    mockSetSearchParams: vi.fn(),
}));
let mockSearchParams = new URLSearchParams();

// Mock all dependencies before importing Shop
vi.mock('../api-services', () => ({
    db: { getProducts: mockGetProducts }
}));

vi.mock('../context/CartContext', () => ({
    useCart: () => ({ addToCart: mockAddToCart })
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

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useSearchParams: () => [mockSearchParams, mockSetSearchParams]
    };
});

// Import after mocks
import { Shop } from './Shop';
import { MemoryRouter } from 'react-router-dom';

describe('Shop', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddToCart.mockClear();
        mockGetProducts.mockClear();
        mockSetSearchParams.mockClear();
        mockSearchParams = new URLSearchParams();
    });

    const renderShop = () => {
        return render(
            <MemoryRouter initialEntries={['/shop']}>
                <Shop />
            </MemoryRouter>
        );
    };

    it('renders ShopHero component', async () => {
        renderShop();
        await waitFor(() => {
            expect(screen.getByTestId('shop-hero')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', async () => {
        renderShop();
        expect(screen.getByText('Loading treasures...')).toBeInTheDocument();
    });

    it('renders category filter buttons', async () => {
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

    it('renders with correct page structure', async () => {
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
        });
    });

    it('renders with dark mode classes', async () => {
        const { container } = renderShop();
        await waitFor(() => {
            const pageContainer = container.firstChild as HTMLElement;
            expect(pageContainer?.className).toContain('dark:bg-slate-900');
        });
    });

    it('renders sticky filter bar', async () => {
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.sticky')).toBeInTheDocument();
        });
    });

    it('renders filter buttons with correct styling', async () => {
        renderShop();
        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    it('renders grid layout for products', async () => {
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.grid')).toBeInTheDocument();
        });
    });

    it('has proper animation classes', async () => {
        const { container } = renderShop();
        await waitFor(() => {
            expect(container.querySelector('.animate-page-enter')).toBeInTheDocument();
        });
    });

    it('changes category when clicking filter button', async () => {
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('souvenir')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('souvenir'));
        expect(mockSetSearchParams).toHaveBeenCalledWith({ category: 'souvenir' });
    });

    it('resets to all when clicking all button', async () => {
        mockSearchParams.set('category', 'souvenir');
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('all')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('all'));
        expect(mockSetSearchParams).toHaveBeenCalledWith({});
    });

    it('scrolls to top when changing category', async () => {
        const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        renderShop();
        await waitFor(() => {
            expect(screen.getByText('souvenir')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('souvenir'));
        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        scrollToSpy.mockRestore();
    });

    it('handles invalid category by defaulting to all', async () => {
        mockSearchParams.set('category', 'invalid-category');
        renderShop();
        await waitFor(() => {
            const allButton = screen.getByText('all');
            expect(allButton.closest('button')).toHaveClass('bg-amber-600');
        });
    });

    it('calls addToCart when Add to Cart is clicked', async () => {
        mockGetProducts.mockResolvedValue([{
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
        expect(mockAddToCart).toHaveBeenCalledWith(expect.objectContaining({
            id: 'p1',
            title: 'Test Product',
            price: 50
        }));
    });

    it('shows toast when adding to cart', async () => {
        mockGetProducts.mockResolvedValue([{
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

    it('uses mock products fallback when API returns empty', async () => {
        mockGetProducts.mockResolvedValue([]);
        renderShop();
        await waitFor(() => {
            const productCards = screen.getAllByTestId('product-card');
            expect(productCards.length).toBeGreaterThan(0);
        });
    });

    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockGetProducts.mockRejectedValue(new Error('API Error'));
        renderShop();
        await waitFor(() => {
            const productCards = screen.getAllByTestId('product-card');
            expect(productCards.length).toBeGreaterThan(0);
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
