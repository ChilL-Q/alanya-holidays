import React from "react";
import type { ProductVariant, ProductSku } from "./types";

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  skus: ProductSku[];
  selectedSkuId: number | null;
  onSelectSkuId: (skuId: number) => void;
}

export function ProductVariantSelector({
  variants,
  skus,
  selectedSkuId,
  onSelectSkuId,
}: ProductVariantSelectorProps) {
  const selectedSku = skus.find((s) => s.id === selectedSkuId) || null;

  return (
    <div className="mb-8 space-y-4">
      {variants.map((variant) => (
        <div key={variant.id}>
          <label className="block text-sm font-medium text-foreground-700 mb-2">
            {variant.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => {
              // Find the SKU matching this option (handles both array and record options)
              const matchingSku = skus.find((s) => {
                if (Array.isArray(s.options)) {
                  return s.options.includes(option);
                }
                if (s.options && typeof s.options === "object") {
                  return Object.values(s.options).includes(option);
                }
                return false;
              });

              const isSelected = matchingSku && matchingSku.id === selectedSkuId;
              const isOutOfStock = matchingSku && matchingSku.stock <= 0;

              return (
                <button
                  key={option}
                  onClick={() => {
                    if (matchingSku && matchingSku.stock > 0) {
                      onSelectSkuId(matchingSku.id);
                    }
                  }}
                  disabled={isOutOfStock}
                  title={
                    isOutOfStock
                      ? "Out of stock"
                      : matchingSku
                        ? `${matchingSku.stock} in stock`
                        : ""
                  }
                  className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-primary-500 text-background-50 border-primary-500"
                      : isOutOfStock
                        ? "bg-background-100 text-foreground-300 border-background-200 line-through cursor-not-allowed"
                        : "bg-white text-foreground-700 border-background-200 hover:border-foreground-300 hover:text-foreground-900"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {selectedSku && (
        <p className="text-xs text-foreground-400 flex items-center gap-1">
          <i className="ri-information-line"></i>
          Selected: <strong className="text-foreground-600">{selectedSku.label}</strong>
          {selectedSku.stock <= 5 && selectedSku.stock > 0 && (
            <span className="text-amber-600 ml-1">
              — Only {selectedSku.stock} left
            </span>
          )}
        </p>
      )}
    </div>
  );
}
