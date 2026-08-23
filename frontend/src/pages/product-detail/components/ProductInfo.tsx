import React from "react";
import type { ProductDetail, ProductVariant, ProductSku } from "./types";
import { ProductVariantSelector } from "./ProductVariantSelector";
import { ProductAddToCartSection } from "./ProductAddToCartSection";

interface ProductInfoProps {
  product: ProductDetail;
  variants: ProductVariant[];
  skus: ProductSku[];
  selectedSkuId: number | null;
  onSelectSkuId: (skuId: number) => void;
  currentPrice: number;
  currentStock: number;
  formatPrice: (price: number) => string;
  quantity: number;
  onSetQuantity: (fn: (prev: number) => number) => void;
  onAddToCart: () => void;
  showCheckout: boolean;
  onToggleCheckout: () => void;
}

export function ProductInfo({
  product,
  variants,
  skus,
  selectedSkuId,
  onSelectSkuId,
  currentPrice,
  currentStock,
  formatPrice,
  quantity,
  onSetQuantity,
  onAddToCart,
  showCheckout,
  onToggleCheckout,
}: ProductInfoProps) {
  const hasVariants = variants.length > 0 && skus.length > 0;

  return (
    <div className="w-full lg:w-1/2 flex flex-col">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="px-2.5 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">
          {product.product_categories?.name || "General"}
        </span>
        {currentStock > 0 ? (
          <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap">
            In Stock
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium whitespace-nowrap">
            Out of Stock
          </span>
        )}
        {hasVariants && (
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium whitespace-nowrap">
            {variants.length} {variants.length === 1 ? "option" : "options"}
          </span>
        )}
      </div>

      <h1 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-4 leading-tight">
        {product.name}
      </h1>

      <div className="text-3xl font-bold text-primary-600 mb-6">
        {formatPrice(currentPrice)}
      </div>

      {/* Variant Pickers */}
      {hasVariants && (
        <ProductVariantSelector
          variants={variants}
          skus={skus}
          selectedSkuId={selectedSkuId}
          onSelectSkuId={onSelectSkuId}
        />
      )}

      <div className="prose prose-sm max-w-none text-foreground-600 leading-relaxed mb-8">
        {product.description.split("\n").map((para, i) => (
          <p key={i} className="mb-3 last:mb-0">
            {para}
          </p>
        ))}
      </div>

      {/* Quantity & Add to Cart */}
      <ProductAddToCartSection
        currentStock={currentStock}
        quantity={quantity}
        onSetQuantity={onSetQuantity}
        onAddToCart={onAddToCart}
        showCheckout={showCheckout}
        onToggleCheckout={onToggleCheckout}
      />
    </div>
  );
}
