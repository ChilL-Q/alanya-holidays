import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Star, User, ShoppingBag } from 'lucide-react';
import { Product, ProductVariant } from '../../types/models';
import { VariantSelector } from './VariantSelector';
import { productsService } from '../../api-services/api/products';

interface ProductModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
    onAddToCart: (product: Product, variant?: ProductVariant) => void;
    formatPrice: (price: string | number) => string;
    convertPrice: (price: number, from: 'USD' | 'EUR') => number;
}

export const ProductModal: React.FC<ProductModalProps> = ({
    isOpen,
    product,
    onClose,
    onAddToCart,
    formatPrice,
    convertPrice,
}) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    useEffect(() => {
        if (isOpen && product?.id) {
            // Reset state when product changes or modal opens
            setActiveImageIndex(0);
            setSelectedVariant(null);

            // Fetch variants
            const fetchVariants = async () => {
                try {
                    const data = await productsService.getProductVariants(product.id!);
                    if (data.length > 0) {
                        setVariants(data);
                    }
                } catch {
                    // Silently fail
                }
            };
            fetchVariants();
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const displayPrice = selectedVariant ? selectedVariant.price : product.price;
    const currentImage = product.images[activeImageIndex] || product.images[0];

    const handleAddToCart = () => {
        onAddToCart(product, selectedVariant ?? undefined);
    };

    const isOutOfStock = selectedVariant !== null && selectedVariant.stock <= 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="3xl"
            noPadding
            hideCloseButton // We handle custom layout
            lockBodyScroll
        >
            <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                {/* Left: Gallery */}
                <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                    {/* Main Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-white">
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt={product.title}
                                className="w-full h-full object-cover animate-in fade-in duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ShoppingBag size={64} />
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {product.images.length > 1 && (
                        <div className="p-4 flex gap-3 overflow-x-auto hide-scrollbar">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                        idx === activeImageIndex
                                            ? 'border-amber-500 opacity-100'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Content */}
                <div className="w-full md:w-1/2 flex flex-col overflow-y-auto">
                    {/* Header */}
                    <div className="p-8 pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                                {product.category}
                            </span>
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Star size={14} fill="currentColor" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">New</span>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-serif">
                            {product.title}
                        </h2>

                        {/* Seller Info */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {product.seller?.full_name || 'Artisan'}
                                </p>
                                <p className="text-xs text-slate-500">Seller</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose prose-slate dark:prose-invert prose-sm max-w-none mb-6">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* Variants */}
                        {variants.length > 0 && (
                            <div className="mb-6">
                                <VariantSelector
                                    variants={variants}
                                    selectedVariant={selectedVariant}
                                    onSelect={setSelectedVariant}
                                />
                                {isOutOfStock && (
                                    <p className="text-red-500 text-sm mt-2 font-medium">Out of Stock</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer: Price & CTA */}
                    <div className="p-8 pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky bottom-0">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Total Price</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {formatPrice(convertPrice(displayPrice, 'EUR'))}
                                </p>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-3 text-lg"
                            >
                                <ShoppingBag size={22} />
                                Add to Basket
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
