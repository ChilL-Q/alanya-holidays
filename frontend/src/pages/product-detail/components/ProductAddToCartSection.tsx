import React from "react";

interface ProductAddToCartSectionProps {
  currentStock: number;
  quantity: number;
  onSetQuantity: (fn: (prev: number) => number) => void;
  onAddToCart: () => void;
  showCheckout: boolean;
  onToggleCheckout: () => void;
}

export function ProductAddToCartSection({
  currentStock,
  quantity,
  onSetQuantity,
  onAddToCart,
  showCheckout,
  onToggleCheckout,
}: ProductAddToCartSectionProps) {
  return (
    <div className="pt-6 border-t border-background-200/70">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Quantity Stepper */}
        <div className="flex items-center gap-0 border border-background-300 rounded-full overflow-hidden bg-white self-start">
          <button
            onClick={() => onSetQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-subtract-line"></i>
          </button>
          <span className="w-12 text-center text-sm font-semibold text-foreground-900 select-none">
            {quantity}
          </span>
          <button
            onClick={() =>
              onSetQuantity((q) => Math.min(currentStock > 0 ? currentStock : 99, q + 1))
            }
            disabled={currentStock > 0 && quantity >= currentStock}
            className="w-10 h-10 flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-add-line"></i>
          </button>
        </div>

        {/* Add to Cart */}
        <button
          onClick={onAddToCart}
          disabled={currentStock <= 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-background-50 rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="ri-shopping-cart-line"></i>
          {currentStock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>

        {/* Buy Now */}
        <button
          onClick={onToggleCheckout}
          disabled={currentStock <= 0}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-semibold hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="ri-flashlight-line"></i>
          {showCheckout ? "Hide Checkout" : "Buy Now"}
        </button>
      </div>

      {currentStock > 0 && currentStock <= 10 && (
        <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
          <i className="ri-alert-line"></i>
          Only {currentStock} left in stock
        </p>
      )}
    </div>
  );
}
