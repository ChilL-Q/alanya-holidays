import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/db';
import { ShoppingBag, Star, User } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext'; // Added
import { ServiceType } from '../types/index';

interface Product {
    id: string;
    title: string;
    price: number;
    description: string;
    category: string;
    stock?: number;
    images: string[];
    artisan: {
        full_name: string;
    };
}

export const Shop: React.FC = () => {
    const { t } = useLanguage();
    const { convertPrice, formatPrice } = useCurrency(); // Added
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';

    // Validate that the category is valid, else default to all
    const validCategories = ['all', 'souvenir', 'textile', 'food', 'jewelry', 'art'];
    const currentCategory = searchParams.get('category') || 'all';
    const filter = validCategories.includes(currentCategory) ? currentCategory : 'all';

    // Sync activeCategory with URL params (Scroll behavior)
    useEffect(() => {
        if (searchParams.get('category')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [searchParams]);

    const handleFilterChange = (newFilter: string) => {
        setSearchParams(newFilter === 'all' ? {} : { category: newFilter });
    };

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart: contextAddToCart } = useCart();

    // Cart Toast State
    const [cartToast, setCartToast] = useState<string | null>(null);

    const handleAddToCart = (product: Product) => {
        contextAddToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images[0],
            type: ServiceType.PRODUCT
        });
        setCartToast(`Added ${product.title} to basket`);
        setTimeout(() => setCartToast(null), 3000);
    };

    // Mock Data for "Examples"
    const mockProducts: Product[] = [
        // Souvenirs
        {
            id: 'm1', title: 'Handblown Glass Evil Eye', price: 15, category: 'souvenir', stock: 10,
            description: 'Traditional Nazar amulet to protect against the evil eye. Handblown by local artisans.',
            images: ['https://images.unsplash.com/photo-1634225254848-6b8014e04991?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Ahmet Yılmaz' }
        },
        {
            id: 'm2', title: 'Alanya Castle Ceramic Plate', price: 25, category: 'souvenir', stock: 5,
            description: 'Hand-painted ceramic plate featuring the iconic Red Tower and Castle.',
            images: ['https://images.unsplash.com/photo-1624558481358-19e0cf94ffdf?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Fatma Demir' }
        },
        // Textile
        {
            id: 'm3', title: 'Organic Cotton Peshtemal', price: 35, category: 'textile', stock: 20,
            description: 'Lightweight, absorbent Turkish towel. Perfect for the beach or hammam.',
            images: ['https://images.unsplash.com/photo-1596395717069-b5f4be81f9b9?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Textile Co-op' }
        },
        {
            id: 'm4', title: 'Silk Ottoman Scarf', price: 60, category: 'textile', stock: 8,
            description: '100% Bursa silk scarf with traditional Ottoman tulip motifs.',
            images: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Ayşe Gül' }
        },
        // Food
        {
            id: 'm5', title: 'Premium Turkish Delight Box', price: 18, category: 'food', stock: 50,
            description: 'Assorted Lokum with double-roasted pistachios, rose, and pomegranate.',
            images: ['https://images.unsplash.com/photo-1589136701168-5256b3e8d99c?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Hacı Baba' }
        },
        {
            id: 'm6', title: 'Village Spices Set', price: 12, category: 'food', stock: 30,
            description: 'Collection of Sumac, Pul Biber (Chili), and Oregano harvested from the Taurus Mountains.',
            images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Spice Market' }
        },
        // Jewelry
        {
            id: 'm7', title: 'Silver Turquoise Ring', price: 45, category: 'jewelry', stock: 3,
            description: '925 Sterling Silver ring with a natural Turkish Turquoise stone.',
            images: ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Mehmet Silver' }
        },
        // Art
        {
            id: 'm8', title: 'Red Tower Watercolor', price: 80, category: 'art', stock: 1,
            description: 'Original watercolor painting of the Alanya harbor at sunset.',
            images: ['https://images.unsplash.com/photo-1576495123999-56c4d70e4e2c?auto=format&fit=crop&q=80&w=600'],
            artisan: { full_name: 'Elena Art' }
        }
    ];

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await db.getProducts(filter === 'all' ? undefined : filter);
                // IF DB is empty, show mocks for demo purposes
                if ((!data || data.length === 0) && filter === 'all') {
                    setProducts(mockProducts);
                } else if ((!data || data.length === 0) && filter !== 'all') {
                    // Filter visuals for mocks if DB is empty
                    setProducts(mockProducts.filter(p => p.category === filter));
                } else {
                    setProducts(data as any);
                }
            } catch (err) {
                console.error(err);
                // Fallback to mocks on error
                setProducts(filter === 'all' ? mockProducts : mockProducts.filter(p => p.category === filter));
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [filter]); // Re-run when filter (derived from URL) changes

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 pb-20 animate-page-enter relative">
            {/* Toast Notification */}
            {cartToast && (
                <div className="fixed top-24 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-right flex items-center gap-3">
                    <div className="bg-green-500 rounded-full p-1"><ShoppingBag size={14} /></div>
                    {cartToast}
                </div>
            )}

            {/* Hero */}
            <div className="relative h-[40vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&q=80&w=2670"
                        alt="Colorful Turkish Lamps"
                        className="w-full h-full object-cover animate-stagger-enter"
                        style={{ animationDelay: '0.1s' }}
                    />
                    <div className="absolute inset-0 bg-slate-900/40"></div>
                </div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-stagger-enter" style={{ animationDelay: '0.3s' }}>
                    <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-2 rounded-full mb-6 border border-amber-500/30 backdrop-blur-md">
                        <ShoppingBag size={18} />
                        <span className="font-medium tracking-wide text-sm uppercase">Alanya Artisan Shop</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
                        Authentic Local Treasures
                    </h1>
                    <p className="text-xl text-slate-200 font-light max-w-2xl mx-auto">
                        Discover handmade goods, spices, and souvenirs directly from local artisans.
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="sticky top-20 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 animate-stagger-enter" style={{ animationDelay: '0.5s' }}>
                <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
                    <div className="flex gap-4 py-4 min-w-max">
                        {['all', 'souvenir', 'textile', 'food', 'jewelry', 'art'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleFilterChange(cat)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${filter === cat
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span className="capitalize">{cat}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading treasures...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
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
                            <div
                                key={product.id}
                                className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-700 animate-stagger-enter flex flex-col"
                                style={{ animationDelay: `${0.1 * index}s` }}
                            >
                                {/* Image Placeholder */}
                                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700 relative overflow-hidden group">
                                    {product?.images?.[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                            <ShoppingBag size={32} />
                                        </div>
                                    )}
                                    {/* Quick Add Button Overlay */}
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="absolute bottom-4 right-4 bg-white text-slate-900 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-amber-500 hover:text-white"
                                        title="Add to Basket"
                                    >
                                        <ShoppingBag size={20} />
                                    </button>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                                            {product.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-yellow-400">
                                            <Star size={14} fill="currentColor" />
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">New</span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                                        {product.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px] flex-grow">
                                        {product.description}
                                    </p>
                                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                <User size={14} />
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                                                {product.artisan?.full_name || 'Artisan'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                                                {formatPrice(convertPrice(product.price, 'EUR'))}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="w-full mt-4 bg-slate-100 dark:bg-slate-700 hover:bg-amber-600 hover:text-white text-slate-900 dark:text-white py-2 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Add to Basket
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
