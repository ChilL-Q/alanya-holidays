import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
    const { items, removeFromCart, total, isCartOpen, setIsCartOpen } = useCart();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    // Prevent body scroll when open
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent body scroll when open & Handle Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsCartOpen(false);
        };

        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isCartOpen, setIsCartOpen]);

    if (!mounted) return null;

    return (
        <>
            {/* Backdrop */}
            {/* Drawer Container - controlled by visibility to allow transitions */}
            {/* Drawer Container - controlled by visibility to allow transitions */}
            <div className={`fixed inset-0 z-[100] flex justify-end transition-visibility duration-500 ${isCartOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-slate-900/20 dark:bg-slate-900/50 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsCartOpen(false)}
                />

                {/* Drawer */}
                <div className={`relative h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="text-teal-600 dark:text-cyan-400 " />
                            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Your Cart</h2>
                            <span className="ml-2 bg-teal-100 dark:bg-slate-800/50 text-teal-700 dark:text-cyan-400 dark:text-slate-200 text-xs font-bold px-2 py-0.5 rounded-full">
                                {items.length} items
                            </span>
                        </div>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/80 rounded-full flex items-center justify-center text-slate-300">
                                    <ShoppingBag size={32} />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">Your cart is empty</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start adding some amazing experiences!</p>
                                </div>
                                <button
                                    onClick={() => setIsCartOpen(false)}
                                    className="text-teal-600 dark:text-cyan-400 font-medium hover:underline"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:border-teal-100 dark:hover:border-teal-900/30 transition-colors group">
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=200&h=200&fit=crop';
                                            }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">{item.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {item.startDate ? `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate!).toLocaleDateString()}` : (item.date ? new Date(item.date).toLocaleDateString() : 'Date: Flexible')}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-bold text-teal-600 dark:text-cyan-400 dark:text-accent dark:text-amber-400 ">{formatPrice(item.price)}</span>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">Subtotal</span>
                                <span className="text-2xl font-bold font-serif text-slate-900 dark:text-accent dark:text-amber-400 ">{formatPrice(total)}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setIsCartOpen(false);
                                    navigate('/checkout');
                                }}
                                className="w-full py-4 bg-teal-600 dark:bg-cyan-600 hover:bg-teal-700 dark:bg-cyan-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Proceed to Checkout</span>
                                <ArrowRight size={20} />
                            </button>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-full py-3 mt-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
