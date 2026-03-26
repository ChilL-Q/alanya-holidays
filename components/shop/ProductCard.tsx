import React from 'react';
import { ShoppingBag, Star, User } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    price: number;
    description: string;
    category: string;
    stock?: number;
    images: string[];
    seller: {
        full_name: string;
    };
}

interface ProductCardProps {
    product: Product;
    index: number;
    onAddToCart: (product: Product) => void;
    formatPrice: (price: string | number) => string;
    convertPrice: (price: number, from: 'USD' | 'EUR') => number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index, onAddToCart, formatPrice, convertPrice }) => {
    return (
        <div
            className="group bg-white dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-800/50 animate-stagger-enter flex flex-col"
            style={{ animationDelay: `${0.1 * index}s` }}
        >
            <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800/50 relative overflow-hidden group">
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
                <button
                    onClick={() => onAddToCart(product)}
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
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-400">
                            <User size={14} />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                            {product.seller?.full_name || 'Artisan'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                            {formatPrice(convertPrice(product.price, 'EUR'))}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onAddToCart(product)}
                    className="w-full mt-4 bg-slate-100 dark:bg-slate-800/50 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-slate-900 dark:text-white py-2 rounded-lg font-medium transition-colors text-sm"
                >
                    Add to Basket
                </button>
            </div>
        </div>
    );
};
