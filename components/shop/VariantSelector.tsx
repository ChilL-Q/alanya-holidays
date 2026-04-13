import React from 'react';
import { ProductVariant } from '../../types/models';

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedVariant: ProductVariant | null;
    onSelect: (variant: ProductVariant) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
    variants,
    selectedVariant,
    onSelect,
}) => {
    if (variants.length === 0) return null;

    return (
        <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Size
            </label>
            <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const isOutOfStock = variant.stock <= 0;

                    return (
                        <button
                            key={variant.id}
                            disabled={isOutOfStock}
                            onClick={() => onSelect(variant)}
                            className={`
                                relative px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200
                                ${isOutOfStock
                                    ? 'border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed line-through'
                                    : isSelected
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-500/5'
                                }
                            `}
                        >
                            {variant.size_label}
                            {isOutOfStock && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
