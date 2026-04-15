import React, { useState, useEffect } from 'react';
import { db } from '../api-services';
import { SEOHead } from '../components/seo/SEOHead';
import { ShoppingBag } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ServiceType } from '../types/index';

// Modular Components
import { ProductCard } from '../components/shop/ProductCard';
import { ShopHero } from '../components/shop/ShopHero';
import { ProductModal } from '../components/shop/ProductModal';
import { Product as DBProduct, ProductVariant } from '../types/models';

// Mock Data
const mockProducts: DBProduct[] = [
    {
        id: 'm1', title: 'Handblown Glass Evil Eye', price: 15, category: 'souvenir', stock: 10,
        description: 'Traditional Nazar amulet to protect against the evil eye. Handblown by local artisans.',
        images: ['https://images.unsplash.com/photo-1634225254848-6b8014e04991?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Ahmet Yılmaz' }
    },
    {
        id: 'm2', title: 'Alanya Castle Ceramic Plate', price: 25, category: 'souvenir', stock: 5,
        description: 'Hand-painted ceramic plate featuring the iconic Red Tower and Castle.',
        images: ['https://images.unsplash.com/photo-1624558481358-19e0cf94ffdf?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Fatma Demir' }
    },
    {
        id: 'm3', title: 'Organic Cotton Peshtemal', price: 35, category: 'textile', stock: 20,
        description: 'Lightweight, absorbent Turkish towel. Perfect for the beach or hammam.',
        images: ['https://images.unsplash.com/photo-1596395717069-b5f4be81f9b9?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Textile Co-op' }
    },
    {
        id: 'm4', title: 'Silk Ottoman Scarf', price: 60, category: 'textile', stock: 8,
        description: '100% Bursa silk scarf with traditional Ottoman tulip motifs.',
        images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Ayşe Gül' }
    },
    {
        id: 'm5', title: 'Premium Turkish Delight Box', price: 18, category: 'food', stock: 50,
        description: 'Assorted Lokum with double-roasted pistachios, rose, and pomegranate.',
        images: ['https://images.unsplash.com/photo-1589136701168-5256b3e8d99c?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Hacı Baba' }
    },
    {
        id: 'm6', title: 'Village Spices Set', price: 12, category: 'food', stock: 30,
        description: 'Collection of Sumac, Pul Biber (Chili), and Oregano harvested from the Taurus Mountains.',
        images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Spice Market' }
    },
    {
        id: 'm7', title: 'Silver Turquoise Ring', price: 45, category: 'jewelry', stock: 3,
        description: '925 Sterling Silver ring with a natural Turkish Turquoise stone.',
        images: ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Mehmet Silver' }
    },
    {
        id: 'm8', title: 'Red Tower Watercolor', price: 80, category: 'art', stock: 1,
        description: 'Original watercolor painting of the Alanya harbor at sunset.',
        images: ['https://images.unsplash.com/photo-1576495123999-56c4d70e4e2c?auto=format&fit=crop&q=80&w=600'],
        seller_id: 'm_seller', seller: { full_name: 'Elena Art' }
    }
];

export const Shop: React.FC = () => {
    // Note: t is unused here but typically used for translations, removing to satisfy ESLint
    const { convertPrice, formatPrice } = useCurrency();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart: contextAddToCart } = useCart();

    const validCategories = ['all', 'souvenir', 'textile', 'food', 'jewelry', 'art'];
    const currentCategory = searchParams.get('category') || 'all';
    const filter = validCategories.includes(currentCategory) ? currentCategory : 'all';

    const [products, setProducts] = useState<DBProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartToast, setCartToast] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await db.getProducts(filter === 'all' ? undefined : filter);
                if ((!data || data.length === 0) && filter === 'all') {
                    setProducts(mockProducts);
                } else if ((!data || data.length === 0) && filter !== 'all') {
                    setProducts(mockProducts.filter(p => p.category === filter));
                } else {
                    setProducts(data || mockProducts);
                }
            } catch (err) {
                console.error(err);
                setProducts(filter === 'all' ? mockProducts : mockProducts.filter(p => p.category === filter));
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [filter]);

    const handleFilterChange = (newFilter: string) => {
        setSearchParams(newFilter === 'all' ? {} : { category: newFilter });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddToCart = (product: DBProduct, variant?: ProductVariant) => {
        contextAddToCart({
            id: product.id,
            title: product.title,
            price: variant ? variant.price : product.price,
            image: product.images[0],
            type: ServiceType.PRODUCT,
            variant_id: variant?.id,
            variant_label: variant?.size_label,
        });
        const label = variant ? `${product.title} (${variant.size_label})` : product.title;
        setCartToast(`Added ${label} to basket`);
        setTimeout(() => setCartToast(null), 3000);
    };

    return (
        <>
        <SEOHead
            title="Alanya Shop — Handcrafted Turkish Goods"
            description="Buy authentic Turkish ceramics, textiles, jewelry, spices and handcrafted souvenirs from Alanya. Unique gifts and local artisan products."
            keywords={['Alanya shop', 'Turkish souvenirs', 'handmade Turkey', 'ceramics Alanya', 'Turkish gifts']}
        />
        <div className="min-h-screen bg-white dark:bg-slate-900 pb-20 animate-page-enter relative">
            {cartToast && (
                <div className="fixed top-24 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-right flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-1"><ShoppingBag size={14} /></div>
                    {cartToast}
                </div>
            )}

            <ShopHero />

            <div className="sticky top-20 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
                    <div className="flex gap-4 py-4 min-w-max">
                        {validCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleFilterChange(cat)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${filter === cat
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
                                    }`}
                            >
                                <span className="capitalize">{cat}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading treasures...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800/50">
                        <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
                        <p className="text-slate-500 mb-6">Be the first to list something in this category!</p>
                        <Link to="/add-product" className="inline-block bg-amber-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-700 transition-colors">
                            List a Product
                        </Link>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index}
                                onAddToCart={handleAddToCart}
                                onCardClick={() => setSelectedProduct(product)}
                                formatPrice={formatPrice}
                                convertPrice={convertPrice}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={!!selectedProduct}
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart}
                formatPrice={formatPrice}
                convertPrice={convertPrice}
            />
        </div>
        </>
    );
};
